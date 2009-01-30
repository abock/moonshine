#include <string.h>

#include "mmp-plugin.h"
#include "mmp-binder.h"

#define MOON_CHECK_LOAD_PLUGIN() { \
	if (G_UNLIKELY (MMP_HANDLE ()->module == NULL)) { \
		mmp_plugin_proxy_load_moonlight (); \
	} \
}

static struct {
	const gchar *mime_type;
	const gchar *extensions;
	const gchar *description;
} mmp_plugin_proxy_mime_types [] = {
	{ "application/x-moon-media",       "",              "Moonlight Media" },
	{ "application/x-mplayer2",         "wmv, avi",      "Windows Media Video" },
	{ "video/x-ms-asf-plugin",          "asf, wmv",      "ASF Video" },
	{ "video/x-msvideo",                "asf, wmv",      "AVI Video" },
	{ "video/x-ms-asf",                 "asf",           "ASF Video" },
	{ "video/x-ms-wmv",                 "wmv",           "Windows Media Video" },
	{ "video/x-wmv",                    "wmv",           "Windows Media Video" },
	{ "video/x-ms-wvx",                 "wmv",           "Windows Media Video" },
	{ "video/x-ms-wm",                  "wmv",           "Windows Media Video" },
	{ "video/x-ms-wmp",                 "wmv",           "Windows Media Video" },
	{ "application/x-ms-wms",           "wms",           "Windows Media Video" },
	{ "application/x-ms-wmp",           "wmp",           "Windows Media Video" },
	{ "application/asx",                "asx",           "Microsoft ASX Playlist" },
	{ "audio/x-ms-wma",                 "wma",           "Windows Media Audio" },
	{ "audio/mpeg",                     "mp3",           "MPEG Audio" },
};

static gboolean
mmp_plugin_proxy_load_symbol (const gchar *symbol_name, gpointer *symbol)
{
	if (!g_module_symbol (MMP_HANDLE ()->module, symbol_name, symbol)) {
		mp_error ("Could not locate '%s' symbol in Moonlight plugin (%s)",
			symbol_name, g_module_error ());

		g_module_close (MMP_HANDLE ()->module);
		MMP_HANDLE ()->module = NULL;

		return FALSE;
	}

	return TRUE;
}

static gboolean
mmp_plugin_proxy_load_module (gchar *prefix)
{
	gchar *path = g_module_build_path (prefix, "moonloader");
	
	if (g_file_test (path, G_FILE_TEST_EXISTS)) {
		MMP_HANDLE ()->module = g_module_open (path, G_MODULE_BIND_LOCAL);
		
		if (MMP_HANDLE ()->module != NULL
			&& mmp_plugin_proxy_load_symbol ("NP_Initialize", (gpointer *)&MMP_HANDLE ()->np_initialize)
			&& mmp_plugin_proxy_load_symbol ("NP_Shutdown", (gpointer *)&MMP_HANDLE ()->np_shutdown)
			&& mmp_plugin_proxy_load_symbol ("NP_GetValue", (gpointer *)&MMP_HANDLE ()->np_getvalue)) {
			mp_debug ("Loaded Moonlight plugin: %s", path);
			g_free (path);
			return TRUE;
		} else if (MMP_HANDLE ()->module != NULL) {
			if (!g_module_close (MMP_HANDLE ()->module)) {
				mp_error ("Could not unload library that was loaded but had invalid symbols: %s (%s)",
					path, g_module_error ());
			}
			MMP_HANDLE ()->module = NULL;
		}
		
		mp_error ("Could not load Moonlight plugin: %s (%s)", path, g_module_error ());
	}

	g_free (path);
	return FALSE;
}

static NPError
mmp_plugin_proxy_load_moonlight ()
{
	static gchar *search_prefixes [] = {
		NULL,
		NULL,
		(gchar *)INSTALL_PREFIX "/lib/moon/plugin",
		(gchar *)INSTALL_PREFIX "/lib64/moon/plugin",
		(gchar *)INSTALL_PREFIX
	};

	guint i;

	if (MMP_HANDLE ()->module != NULL) {
		return NPERR_NO_ERROR;
	}

	search_prefixes[0] = (gchar *)g_getenv ("MOON_LOADER_PATH");
	search_prefixes[1] = g_build_filename (g_get_home_dir (), ".mozilla", "plugins", NULL);
	
	for (i = 0; i < G_N_ELEMENTS (search_prefixes) 
		&& !mmp_plugin_proxy_load_module (search_prefixes[i]); i++);

	g_free (search_prefixes[1]);
	
	return MMP_HANDLE ()->module == NULL
		? NPERR_GENERIC_ERROR
		: NPERR_NO_ERROR;
}

// Mozilla Plugin Entry Points

NPError
NP_Initialize (NPNetscapeFuncs *mozilla_funcs, NPPluginFuncs *plugin_funcs)
{
	MoonlightPlugin *moon_host = MMP_HANDLE ();
	gsize mozilla_funcs_size;

	MOON_CHECK_LOAD_PLUGIN ();

	mp_debug ("NP_Initialize (%p, %p)", mozilla_funcs, plugin_funcs);

	// Copy the Mozilla function table
	mozilla_funcs_size = sizeof (NPNetscapeFuncs);
	memset (&moon_host->mozilla_funcs, 0, mozilla_funcs_size);
	mozilla_funcs_size = mozilla_funcs->size < mozilla_funcs_size
		? mozilla_funcs->size
		: mozilla_funcs_size;
	memcpy (&moon_host->mozilla_funcs, mozilla_funcs, mozilla_funcs_size);
	moon_host->mozilla_funcs.size = sizeof (moon_host->mozilla_funcs);

	// Proxy NP_Initialize to Moonlight
	if (MMP_HANDLE ()->np_initialize != NULL) {
		NPError result = MMP_HANDLE ()->np_initialize (&moon_host->mozilla_funcs, plugin_funcs);
		if (result == NPERR_NO_ERROR) {
			// Override some Moonlight NPP functions
			moon_host->moon_npp_new = plugin_funcs->newp;
			plugin_funcs->newp = mmp_binder_npp_new;

			moon_host->moon_npp_destroy = plugin_funcs->destroy;
			plugin_funcs->destroy = mmp_binder_npp_destroy;

			moon_host->moon_npp_stream_as_file = plugin_funcs->asfile;
			plugin_funcs->asfile = mmp_binder_npp_stream_as_file;
		}

		return result;
	}

	return NPERR_GENERIC_ERROR;
}

NPError
NP_Shutdown ()
{
	mp_debug ("NP_Shutdown");

	if (MMP_HANDLE ()->np_shutdown != NULL) {
		MMP_HANDLE ()->np_shutdown ();
	}

	if (MMP_HANDLE ()->module != NULL) {
		g_module_close (MMP_HANDLE ()->module);
	}

	g_free (MMP_HANDLE ()->mime_description);
	memset (MMP_HANDLE (), 0, sizeof (MoonlightPlugin));

	return NPERR_NO_ERROR;
}

NPError
NP_GetValue (gpointer future, NPPVariable variable, gpointer value)
{
	MOON_CHECK_LOAD_PLUGIN ();
	mp_debug ("NP_GetValue");

	switch (variable) {
		case NPPVpluginNameString:
			*((gchar **)value) = (gchar *)"Moonlight Media Player";
			return NPERR_NO_ERROR;
		case NPPVpluginDescriptionString:
			*((gchar **)value) = (gchar *)"A media player powered by Moonlight, largely "
				"compatible with the Windows Media Player ActiveX control.";
			return NPERR_NO_ERROR;
		default:
			if (MMP_HANDLE ()->np_getvalue != NULL) {
				return MMP_HANDLE ()->np_getvalue (future, variable, value); 
			}

			return NPERR_GENERIC_ERROR;
	}

	g_assert_not_reached ();
}

gchar *
NP_GetMIMEDescription ()
{
	GString *str;
	guint i;

	mp_debug ("NP_GetMIMEDescription");

	if (MMP_HANDLE ()->mime_description != NULL) {
		return MMP_HANDLE ()->mime_description;
	}

	str = g_string_new ("");
	for (i = 0; i < G_N_ELEMENTS (mmp_plugin_proxy_mime_types); i++) {
		if (i > 0) {
			g_string_append_c (str, ';');
		}

		g_string_append (str, mmp_plugin_proxy_mime_types[i].mime_type);
		g_string_append_c (str, ':');
			
		if (mmp_plugin_proxy_mime_types[i].extensions) {
			g_string_append (str, mmp_plugin_proxy_mime_types[i].extensions);
		}

		g_string_append_c (str, ':');
		g_string_append (str, mmp_plugin_proxy_mime_types[i].description);
	}
	
	MMP_HANDLE ()->mime_description = str->str;
	g_string_free (str, false);
	
	return MMP_HANDLE ()->mime_description;
}


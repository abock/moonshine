#include <string.h>

#include <nsCOMPtr.h>
#include <nsStringAPI.h>
#include <nsILocalFile.h>
#include <nsServiceManagerUtils.h>
#include <nsIProperties.h>

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
} mmp_plugin_proxy_mime_types [] = {
	// Special application type for this plugin
	{ "application/x-moon-media", "*" },
	
	// Generic/WMP types?
	{ "application/x-mplayer2",   "*" },
	{ "application/x-ms-wms",     "*" },
	{ "application/x-ms-wmp",     "*" },
	{ "application/asx",          "*" },
	{ "video/x-ms-asf-plugin",    "*" },
	{ "video/x-msvideo",          "*" },
	{ "video/x-ms-wmp",           "*" },
	
	// Actual WM types?
	{ "video/x-ms-asf",           "asf,asx,*" },
	{ "video/x-ms-wm",            "wm,*"      },
	{ "video/x-ms-wmv",           "wmv,*"     },
	{ "video/x-ms-wvx",           "wvx,*"     },
	{ "audio/x-ms-wma",           "wma,*"     },
	{ "audio/x-ms-wax",           "wax,*"     },
};

static gboolean moon_module_load_attempted = FALSE;

static gboolean
mmp_plugin_proxy_load_symbol (const gchar *symbol_name, gpointer *symbol)
{
	MoonlightPlugin *plugin_host = MMP_HANDLE ();

	if (!g_module_symbol (plugin_host->module, symbol_name, symbol)) {
		mp_error ("Could not locate '%s' symbol in Moonlight plugin (%s)",
			symbol_name, g_module_error ());

		g_module_close (plugin_host->module);
		plugin_host->module = NULL;

		return FALSE;
	}

	return TRUE;
}

static gboolean
mmp_plugin_proxy_load_module (gchar *prefix)
{
	MoonlightPlugin *plugin_host = MMP_HANDLE ();
	gchar *path = g_module_build_path (prefix, "moonloader");
	
	if (g_file_test (path, G_FILE_TEST_EXISTS)) {
		plugin_host->module = g_module_open (path, G_MODULE_BIND_LOCAL);
		
		if (plugin_host->module != NULL
			&& mmp_plugin_proxy_load_symbol ("NP_Initialize", (gpointer *)&plugin_host->np_initialize)
			&& mmp_plugin_proxy_load_symbol ("NP_Shutdown", (gpointer *)&plugin_host->np_shutdown)
			&& mmp_plugin_proxy_load_symbol ("NP_GetValue", (gpointer *)&plugin_host->np_getvalue)) {
			mp_debug ("Loaded Moonlight plugin: %s", path);
			g_free (path);
			return TRUE;
		} else if (plugin_host->module != NULL) {
			if (!g_module_close (plugin_host->module)) {
				mp_error ("Could not unload library that was loaded but had invalid symbols: %s (%s)",
					path, g_module_error ());
			}
			plugin_host->module = NULL;
		}
		
		mp_error ("Could not load Moonlight plugin: %s (%s)", path, g_module_error ());
	}

	g_free (path);
	return FALSE;
}

static void
mmp_plugin_proxy_load_moonlight_from_xpi ()
{
	// If Moonlight is installed by the user into their Firefox profile (XPI),
	// we have to query Mozilla to get the profile directory and search
	// inside that. It's ugly.

	nsresult result;
	
	nsCOMPtr<nsIProperties> dir_service (do_GetService ("@mozilla.org/file/directory_service;1", &result));
	if (NS_FAILED (result)) {
		return;
	}

	nsCOMPtr<nsIFile> dir;
	result = dir_service->Get ("ProfD", NS_GET_IID (nsIFile), getter_AddRefs (dir));
	if (NS_FAILED (result)) {
		return;
	}

	nsAutoString path;
	nsCAutoString cpath;
	dir->GetPath (path);
	CopyUTF16toUTF8 (path, cpath);

	gchar *ex_plugins_path = g_build_filename (cpath.get (), 
		"extensions", "moonlight@novell.com", "plugins", NULL);
	mmp_plugin_proxy_load_module (ex_plugins_path);
	g_free (ex_plugins_path);
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

	MoonlightPlugin *plugin_host = MMP_HANDLE ();
	guint i;

	if (plugin_host->module != NULL) {
		return NPERR_NO_ERROR;
	} else if (moon_module_load_attempted) {
		return NPERR_GENERIC_ERROR;
	}

	search_prefixes[0] = (gchar *)g_getenv ("MOON_LOADER_PATH");
	search_prefixes[1] = g_build_filename (g_get_home_dir (), ".mozilla", "plugins", NULL);
	
	for (i = 0; i < G_N_ELEMENTS (search_prefixes) 
		&& !mmp_plugin_proxy_load_module (search_prefixes[i]); i++);

	g_free (search_prefixes[1]);
	moon_module_load_attempted = TRUE;
	
	if (plugin_host->module == NULL) {
		mmp_plugin_proxy_load_moonlight_from_xpi ();

		if (plugin_host->module == NULL) {
			mp_error ("Could not find Moonlight's libmoonloader plugin");
			return NPERR_GENERIC_ERROR;
		}
	}

	return NPERR_NO_ERROR;
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
	MoonlightPlugin *plugin_host = MMP_HANDLE ();

	mp_debug ("NP_Shutdown");

	if (plugin_host->np_shutdown != NULL) {
		plugin_host->np_shutdown ();
	}

	if (plugin_host->module != NULL) {
		g_module_close (plugin_host->module);
	}

	g_free (plugin_host->mime_description);
	memset (plugin_host, 0, sizeof (MoonlightPlugin));

	return NPERR_NO_ERROR;
}

NPError
NP_GetValue (gpointer future, NPPVariable variable, gpointer value)
{
	switch (variable) {
		case NPPVpluginNameString:
			*((gchar **)value) = (gchar *)"Windows Media Player Plug-in 10 (compatible; Moonlight Media Player)";
			return NPERR_NO_ERROR;
		case NPPVpluginDescriptionString:
			*((gchar **)value) = (gchar *)"A media player powered by <a href=\"http://go-mono.com/moonlight\">Moonlight</a>, largely "
				"compatible with the Windows Media Player ActiveX control.";
			return NPERR_NO_ERROR;
		default: {
			MoonlightPlugin *plugin_host = MMP_HANDLE ();
			if (plugin_host->np_getvalue != NULL) {
				return plugin_host->np_getvalue (future, variable, value);
			}

			return NPERR_INVALID_PARAM;
		}
	}

	g_assert_not_reached ();
}

gchar *
NP_GetMIMEDescription ()
{
	MoonlightPlugin *plugin_host = MMP_HANDLE ();
	GString *str;
	guint i;

	if (plugin_host->mime_description != NULL) {
		return plugin_host->mime_description;
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

		g_string_append (str, ":Media Files");
	}
	
	plugin_host->mime_description = str->str;
	g_string_free (str, false);
	
	return plugin_host->mime_description;
}


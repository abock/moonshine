#include <config.h>
#include <stdio.h>
#include <string.h>

#include <glib.h>
#include <gmodule.h>
#include <npupp.h>

#define MOON_LOADER_ENABLED 0

#if MOON_LOADER_ENABLED
# define MOON_LOADER_QUOTE(x) #x
# define MOON_LOADER_SYM(x) MOON_LOADER_QUOTE(Plugin_##x)
# define MOON_MODULE "moonplugin"
#else
# define MOON_LOADER_SYM(x) #x
# define MOON_MODULE "moonloader"
#endif

#define mp_debug(...) g_debug   ("libmoonmp-plugin: " __VA_ARGS__)
#define mp_error(...) g_warning ("libmoonmp-plugin: " __VA_ARGS__)

#define MOON_CHECK_LOAD_PLUGIN() { \
	if (G_UNLIKELY (moonlight_plugin.module == NULL)) { \
		moon_mp_load_moonlight (); \
	} \
}

typedef NPError (* MoonEntry_NP_Initialize) (NPNetscapeFuncs *mozilla_funcs, NPPluginFuncs *plugin_funcs);
typedef NPError (* MoonEntry_NP_Shutdown)   ();
typedef NPError (* MoonEntry_NP_GetValue)   (gpointer future, NPPVariable variable, gpointer value);

static struct {
	GModule *module;
	gchar *mime_description;

	NPNetscapeFuncs *mozilla_funcs;

	MoonEntry_NP_Initialize np_initialize;
	MoonEntry_NP_Shutdown np_shutdown;
	MoonEntry_NP_GetValue np_getvalue;

	NPP_NewUPP moon_npp_new;
	NPP_StreamAsFileUPP moon_npp_asfile;
} moonlight_plugin = { 0, };

static struct {
	const gchar *mime_type;
	const gchar *extensions;
	const gchar *description;
} moon_mp_mime_types [] = {
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
moon_mp_load_symbol (const gchar *symbol_name, gpointer *symbol)
{
	if (!g_module_symbol (moonlight_plugin.module, symbol_name, symbol)) {
		mp_error ("Could not locate '%s' symbol in Moonlight plugin (%s)",
			symbol_name, g_module_error ());

		g_module_close (moonlight_plugin.module);
		moonlight_plugin.module = NULL;

		return FALSE;
	}

	return TRUE;
}

static gboolean
moon_mp_load_module (gchar *prefix)
{
	gchar *path = g_module_build_path (prefix, MOON_MODULE);
	
	if (g_file_test (path, G_FILE_TEST_EXISTS)) {
		moonlight_plugin.module = g_module_open (path, G_MODULE_BIND_LOCAL);
		
		if (moonlight_plugin.module != NULL
			&& moon_mp_load_symbol (MOON_LOADER_SYM (NP_Initialize), (gpointer *)&moonlight_plugin.np_initialize)
			&& moon_mp_load_symbol (MOON_LOADER_SYM (NP_Shutdown), (gpointer *)&moonlight_plugin.np_shutdown)
			&& moon_mp_load_symbol (MOON_LOADER_SYM (NP_GetValue), (gpointer *)&moonlight_plugin.np_getvalue)) {
			mp_debug ("Loaded Moonlight plugin: %s", path);
			g_free (path);
			return TRUE;
		} else if (moonlight_plugin.module != NULL) {
			if (!g_module_close (moonlight_plugin.module)) {
				mp_error ("Could not unload library that was loaded but had invalid symbols: %s (%s)",
					path, g_module_error ());
			}
			moonlight_plugin.module = NULL;
		}
		
		mp_error ("Could not load Moonlight plugin: %s (%s)", path, g_module_error ());
	}

	g_free (path);
	return FALSE;
}

static NPError
moon_mp_load_moonlight ()
{
	static gchar *search_prefixes [] = {
		NULL,
		NULL,
		(gchar *)INSTALL_PREFIX "/lib/moon/plugin",
		(gchar *)INSTALL_PREFIX "/lib64/moon/plugin",
		(gchar *)INSTALL_PREFIX
	};

	guint i;

	if (moonlight_plugin.module != NULL) {
		return NPERR_NO_ERROR;
	}

	search_prefixes[0] = (gchar *)g_getenv ("MOON_LOADER_PATH");
	search_prefixes[1] = g_build_filename (g_get_home_dir (), ".mozilla", "plugins", NULL);
	
	for (i = 0; i < G_N_ELEMENTS (search_prefixes) && !moon_mp_load_module (search_prefixes[i]); i++);

	g_free (search_prefixes[1]);
	
	return moonlight_plugin.module == NULL
		? NPERR_GENERIC_ERROR
		: NPERR_NO_ERROR;
}

static NPObject *
moon_mp_get_host (NPP instance)
{
	NPObject *object = NULL;
	if (moonlight_plugin.mozilla_funcs->getvalue (instance, NPNVPluginElementNPObject, &object) != NPERR_NO_ERROR) {
		mp_error ("Failed to get plugin host object");
	}
	return object;
}

static gboolean
moon_mp_evaluate (NPP instance, const gchar *code)
{
	NPObject *object = moon_mp_get_host (instance);
	NPString string;
	NPVariant output;
	gboolean result;

	if (object == NULL) {
		return FALSE;
	}

	string.utf8characters = code;
	string.utf8length = strlen (code);

	result = moonlight_plugin.mozilla_funcs->evaluate (instance, object, &string, &output);
	moonlight_plugin.mozilla_funcs->releasevariantvalue (&output);
	return result;
}

// Plugin Hooks

NPError
NPP_New (NPMIMEType pluginType, NPP instance, gushort mode, 
	gshort argc, gchar **argn, gchar **argv, NPSavedData *saved)
{
	NPError result;
	gchar **param_names;
	gchar **param_values;
	gint param_count = 0, i;

	param_names = g_new0 (gchar *, argc);
	param_values = g_new0 (gchar *, argc);

	if (param_names == NULL || param_values == NULL) {
		return NPERR_GENERIC_ERROR;
	}
	
	for (i = 0; i < argc; i++) {
		if (g_ascii_strcasecmp (argn[i], "ssssource") != 0) {
			param_count++;

			if (g_ascii_strcasecmp (argn[i], "type") == 0) {
				param_names[i] = g_strdup ("type");
				param_values[i] = g_strdup ("application/x-silverlight");
			} else {
				param_names[i] = g_strdup (argn[i]);
				param_values[i] = g_strdup (argv[i]);
			}
		}
	}
	result = moonlight_plugin.moon_npp_new (pluginType, instance, mode, 
		param_count, param_names, param_values, saved);

	moon_mp_evaluate (instance, "{ var me = document.getElementById ('media-object'); var x = document.createElement ('script'); x.type = 'text/xaml'; x.id = 'foofa'; x.appendChild (document.createTextNode ('<Canvas xmlns=\"http://schemas.microsoft.com/client/2007\"><TextBlock>OMG YES</TextBlock></Canvas>')); me.parentNode.appendChild (x); setTimeout (function () { var q = document.getElementById ('media-object'); q.source='#foofa'; alert (q.source); }, 500); alert (x); }");


	// Right now param_names and param_values gets leaked
	// Consider tracking the instance and freeing on NPP_Destroy

	return result;
}

typedef struct {
	gint type;
	gpointer *data;
} StreamNotify;

void
NPP_StreamAsFile (NPP instance, NPStream *stream, const gchar *fname)
{
	// We handle all source notifications
//	if (stream->notifyData == NULL || ((StreamNotify *)stream->notifyData)->type != 1) {
		moonlight_plugin.moon_npp_asfile (instance, stream, fname);
//		return;
//	}

//	mp_debug ("NOTIFY SOURCE: %s (%s)", fname, stream->url);
}

// Mozilla Plugin Entry Points

NPError
NP_Initialize (NPNetscapeFuncs *mozilla_funcs, NPPluginFuncs *plugin_funcs)
{
	MOON_CHECK_LOAD_PLUGIN ();
	mp_debug ("NP_Initialize (%p, %p)", mozilla_funcs, plugin_funcs);

	if (moonlight_plugin.np_initialize != NULL) {
		NPError result = moonlight_plugin.np_initialize (mozilla_funcs, plugin_funcs);
		if (result == NPERR_NO_ERROR) {
			// Override some Moonlight NPP functions
			moonlight_plugin.moon_npp_new = plugin_funcs->newp;
			plugin_funcs->newp = NPP_New;

			moonlight_plugin.moon_npp_asfile = plugin_funcs->asfile;
			plugin_funcs->asfile = NPP_StreamAsFile;

			moonlight_plugin.mozilla_funcs = mozilla_funcs;
		}

		return result;
	}

	return NPERR_GENERIC_ERROR;
}

NPError
NP_Shutdown ()
{
	mp_debug ("NP_Shutdown");

	if (moonlight_plugin.module != NULL) {
		if (moonlight_plugin.np_shutdown != NULL) {
			moonlight_plugin.np_shutdown ();
		}

		g_module_close (moonlight_plugin.module);
	}

	g_free (moonlight_plugin.mime_description);
	memset (&moonlight_plugin, 0, sizeof (moonlight_plugin));

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
			if (moonlight_plugin.np_getvalue != NULL) {
				return moonlight_plugin.np_getvalue (future, variable, value); 
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

	if (moonlight_plugin.mime_description != NULL) {
		return moonlight_plugin.mime_description;
	}

	str = g_string_new ("");
	for (i = 0; i < G_N_ELEMENTS (moon_mp_mime_types); i++) {
		if (i > 0) {
			g_string_append_c (str, ';');
		}

		g_string_append (str, moon_mp_mime_types[i].mime_type);
		g_string_append_c (str, ':');
			
		if (moon_mp_mime_types[i].extensions) {
			g_string_append (str, moon_mp_mime_types[i].extensions);
		}

		g_string_append_c (str, ':');
		g_string_append (str, moon_mp_mime_types[i].description);
	}
	
	moonlight_plugin.mime_description = str->str;
	g_string_free (str, false);
	
	return moonlight_plugin.mime_description;
}


//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

#include <string.h>
#include <unistd.h>

#include <config.h>

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
	{ "application/x-moonshine-player", "*" },
	
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
		plugin_host->module = g_module_open (path, G_MODULE_BIND_LOCAL | G_MODULE_BIND_LAZY);
		
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

static gchar *
mmp_plugin_proxy_get_xpi_moonlight_path ()
{
	// If Moonlight is installed by the user into their Firefox profile (XPI),
	// we need to find the directory. Originally I used XPCOM and the directory
	// service provided by Mozilla, but I really wanted to avoid libstdc++
	// and linking against libxpcom, etc. 
	// 
	// Instead I use an lsof inspired hack to look for the profile directory
	// of the running process.
	//

	gchar pid_path[32];
	gchar fd_path[sizeof (pid_path) * 2];
	const gchar *fd_name = NULL;
	gchar *xpi_dir = NULL;
	GDir *dir;

	if ((gsize)g_snprintf (pid_path, sizeof (pid_path), 
		"/proc/%d/fd", getpid ()) > sizeof (pid_path)) {
		return NULL;
	}

	if ((dir = g_dir_open (pid_path, 0, NULL)) == NULL) {
		return NULL;
	}

	while (xpi_dir == NULL && (fd_name = g_dir_read_name (dir)) != NULL) {
		gchar *fd_resolved_path;
		gchar *file_name;
		gchar *dir_name;
		gint ext_offset;

		if ((gsize)g_snprintf (fd_path, sizeof (fd_path), 
			"%s/%s", pid_path, fd_name) > sizeof (fd_path) ||
			(fd_resolved_path = g_file_read_link (fd_path, NULL)) == NULL) {
			continue;
		}

		file_name = g_path_get_basename (fd_resolved_path);
		ext_offset = strlen (file_name) - strlen (".sqlite");
		if (strcmp (file_name, ".parentlock") == 0 
			|| (ext_offset > 0 && strcmp (file_name + ext_offset, ".sqlite") == 0)) {
			dir_name = g_path_get_dirname (fd_resolved_path);
			xpi_dir = g_build_filename (dir_name, 
				"extensions", 
				"moonlight@novell.com", 
				"plugins", 
				NULL);
			g_free (dir_name);
		}

		g_free (file_name);
		g_free (fd_resolved_path);
	}

	g_dir_close (dir);

	return xpi_dir;
}

static NPError
mmp_plugin_proxy_load_moonlight ()
{
	static gchar *search_prefixes [] = {
		NULL,
		NULL,
		NULL,
		(gchar *)"/usr/lib/moon/plugin",
		(gchar *)"/usr/lib64/moon/plugin",
		(gchar *)"/usr/local/lib/moon/plugin",
		(gchar *)"/usr/local/lib64/moon/plugin",
		(gchar *)INSTALL_PREFIX "/lib/moon/plugin",
		(gchar *)INSTALL_PREFIX "/lib64/moon/plugin"
	};

	MoonlightPlugin *plugin_host = MMP_HANDLE ();
	guint i;

	if (plugin_host->module != NULL) {
		return NPERR_NO_ERROR;
	} else if (moon_module_load_attempted) {
		return NPERR_GENERIC_ERROR;
	}

	search_prefixes[0] = (gchar *)g_getenv ("MOON_LOADER_PATH");
	search_prefixes[1] = mmp_plugin_proxy_get_xpi_moonlight_path ();
	search_prefixes[2] = g_build_filename (g_get_home_dir (), ".mozilla", "plugins", NULL);
	
	for (i = 0; i < G_N_ELEMENTS (search_prefixes) 
		&& !mmp_plugin_proxy_load_module (search_prefixes[i]); i++);

	if (search_prefixes[1] != NULL) {
		g_free (search_prefixes[1]);
	}

	g_free (search_prefixes[2]);

	moon_module_load_attempted = TRUE;
	
	if (plugin_host->module == NULL) {
		mp_error ("Could not find Moonlight's libmoonloader plugin");
		return NPERR_GENERIC_ERROR;
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
		} else {
			mp_error ("Unknown error in libmoonloader's NP_Initialize: %d", result);
		}

		return result;
	}

	mp_error ("Could not call NP_Initialize from libmoonloader (NULL)");

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

	moon_module_load_attempted = FALSE;

	return NPERR_NO_ERROR;
}

NPError
NP_GetValue (gpointer future, NPPVariable variable, gpointer value)
{
	switch (variable) {
		case NPPVpluginNameString:
			*((gchar **)value) = (gchar *)"Windows Media Player Plug-in 10 (compatible; Moonshine Media Player)";
			return NPERR_NO_ERROR;
		case NPPVpluginDescriptionString:
			*((gchar **)value) = (gchar *)"A media player powered by Moonlight, largely "
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


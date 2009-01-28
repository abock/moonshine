/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: t; c-basic-offset: 8 -*- */
/*
 * plugin-embedded-media.cpp: hooks to implement embedded media through a XAML mapping
 *
 * Contact:
 *   Moonlight List (moonlight-list@lists.ximian.com)
 *
 * Copyright 2008 Novell, Inc. (http://www.novell.com)
 *
 * See the LICENSE file included with the distribution for details.
 *
 */

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif

#include "moonlight.h"
#include "plugin.h"
#include "embedded-media/embedded-media-resources.h"

static PluginInstance *c_plugin = NULL;

static char *
plugin_embedded_media_read_file (const char *path)
{
	char *buffer = NULL;
	if (g_file_get_contents (path, &buffer, NULL, NULL)) {
		return buffer;
	}
	return NULL;
}

static void
plugin_embedded_media_load_js_files (PluginInstance *plugin)
{
	char *env, **js_files, *js_data;
	int i, n;

	// FIXME: Cache JS loaded from disk in a list?
	if ((env = getenv ("MOONLIGHT_MEDIA_PLAYER_JS")) != NULL) {
		js_files = g_strsplit (env, ",", 0);
		for (i = 0, n = g_strv_length (js_files); i < n; i++) {
			js_data = plugin_embedded_media_read_file (js_files[i]);
			if (js_data != NULL) {
				plugin->Evaluate (js_data);
				g_free (js_data);
			}
		}
		g_strfreev (js_files);
		return;
	}

	plugin->Evaluate (_EMBEDDED_SILVER_RESOLVER_JS);
	plugin->Evaluate (_EMBEDDED_MEDIA_PLAYER_JS);
}

static char *
plugin_embedded_media_load_xaml ()
{
	char *env;
	return (env = getenv ("MOONLIGHT_MEDIA_PLAYER_XAML")) != NULL
		? plugin_embedded_media_read_file (env)
		: (char *)_EMBEDDED_MEDIA_PLAYER_XAML;
}

void *
plugin_embedded_media_stream_as_file_hook (void *_plugin, NPStream *stream, const char *source_location)
{
	static const char *js_vars = 
		"var __moon_media_embed_id   = \"%s\";"
		"var __moon_media_source_uri = \"%s\";";
	
	PluginInstance *plugin = (PluginInstance *)_plugin;
	PluginXamlLoader *xaml_loader;
	char *js_vars_instance, *xaml;

	// FIXME: Hack to avoid the same source_location from being
	// loaded more than once against the same plugin instance
	if (c_plugin != NULL && c_plugin == plugin) {
		return NULL;
	}
	c_plugin = plugin;

	// Define some dependency globals in JavaScript
	js_vars_instance = g_strdup_printf (js_vars, plugin->GetId (), source_location);
	plugin->Evaluate (js_vars_instance);
	g_free (js_vars_instance);

	plugin_embedded_media_load_js_files (plugin);

	xaml = plugin_embedded_media_load_xaml ();
	xaml_loader = PluginXamlLoader::FromStr (xaml, plugin, plugin->GetSurface ());
	if (xaml != _EMBEDDED_MEDIA_PLAYER_XAML) {
		g_free (xaml);
	}

	return xaml_loader;
}


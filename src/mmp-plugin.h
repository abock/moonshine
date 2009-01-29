#ifndef _MMP_PLUGIN_H
#define _MMP_PLUGIN_H

#include <glib.h>
#include <gmodule.h>
#include <npupp.h>

#define mp_debug(...) g_debug   ("libmoonmp-plugin: " __VA_ARGS__)
#define mp_error(...) g_warning ("libmoonmp-plugin: " __VA_ARGS__)

typedef NPError (* MoonEntry_NP_Initialize) (NPNetscapeFuncs *mozilla_funcs, NPPluginFuncs *plugin_funcs);
typedef NPError (* MoonEntry_NP_Shutdown)   ();
typedef NPError (* MoonEntry_NP_GetValue)   (gpointer future, NPPVariable variable, gpointer value);

typedef struct {
	GModule *module;
	gchar *mime_description;

	MoonEntry_NP_Initialize np_initialize;
	MoonEntry_NP_Shutdown np_shutdown;
	MoonEntry_NP_GetValue np_getvalue;

	NPP_NewUPP moon_npp_new;
	NPP_DestroyUPP moon_npp_destroy;

	NPNetscapeFuncs mozilla_funcs;
} MoonlightPlugin;

MoonlightPlugin *  MMP_HANDLE ();

typedef struct {
	NPP moz_instance;
	gchar **param_names;
	gchar **param_values;
} MoonlightPluginInstance;

MoonlightPluginInstance *  mmp_plugin_find_instance (NPP instance);
MoonlightPluginInstance *  mmp_plugin_new (NPP instance);
void                       mmp_plugin_free (MoonlightPluginInstance * plugin_instance);

#endif /* _MMP_PLUGIN_H */


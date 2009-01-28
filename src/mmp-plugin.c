#include <string.h>

#include "mmp-plugin.h"

static MoonlightPlugin moonlight_plugin = { 0, };
static GHashTable *mmp_plugin_instances = NULL;

MoonlightPlugin *
MMP_HANDLE () 
{
	return &moonlight_plugin;
}

static void
string_to_npvariant (const char *value, NPVariant *result)
{
	gchar *retval = g_strdup (value == NULL ? "" : value);
	STRINGZ_TO_NPVARIANT (retval, *result);
}

MoonlightPluginInstance *
mmp_plugin_new (NPP instance)
{
	MoonlightPluginInstance *plugin_instance = g_new0 (MoonlightPluginInstance, 1);
	plugin_instance->moz_instance = instance;

	if (mmp_plugin_instances == NULL) {
		mmp_plugin_instances = g_hash_table_new (NULL, NULL);
	}

	g_hash_table_insert (mmp_plugin_instances, instance, plugin_instance);
	return plugin_instance;
}

void
mmp_plugin_free (MoonlightPluginInstance *plugin)
{
	if (mmp_plugin_instances != NULL) {
		g_hash_table_remove (mmp_plugin_instances, plugin->moz_instance);

		if (g_hash_table_size (mmp_plugin_instances) == 0) {
			g_hash_table_destroy (mmp_plugin_instances);
			mmp_plugin_instances = NULL;
		}
	}

	g_strfreev (plugin->param_names);
	g_strfreev (plugin->param_values);
	g_free (plugin);
}

MoonlightPluginInstance *
mmp_plugin_find_instance (NPP instance)
{
	if (mmp_plugin_instances != NULL) {
		return (MoonlightPluginInstance *)g_hash_table_lookup (mmp_plugin_instances, instance);
	}

	return NULL;
}

static NPObject *
mmp_plugin_get_host (NPP instance)
{
	NPObject *object = NULL;
	if (moonlight_plugin.mozilla_funcs->getvalue (instance, 
		NPNVPluginElementNPObject, &object) != NPERR_NO_ERROR) {
		mp_error ("Failed to get plugin host object");
	}
	return object;
}

gboolean
mmp_plugin_evaluate (MoonlightPluginInstance *plugin, const gchar *code)
{
	NPObject *host;
	NPString string;
	NPVariant output;
	gboolean result;

	g_return_val_if_fail (plugin != NULL, FALSE);
	g_return_val_if_fail (plugin->moz_instance != NULL, FALSE);
	host = mmp_plugin_get_host (plugin->moz_instance);
	g_return_val_if_fail (host != NULL, FALSE);

	string.utf8characters = code;
	string.utf8length = strlen (code);

	result = moonlight_plugin.mozilla_funcs->evaluate (plugin->moz_instance, host, &string, &output);
	moonlight_plugin.mozilla_funcs->releasevariantvalue (&output);
	return result;
}

void
mmp_plugin_set_property_string (MoonlightPluginInstance *plugin, const gchar *name, const gchar *value)
{
	NPVariant npvalue;
	NPObject *host = NULL;
	NPIdentifier identifier;

	g_return_if_fail (plugin != NULL);
	g_return_if_fail (plugin->moz_instance != NULL);
	host = mmp_plugin_get_host (plugin->moz_instance);
	g_return_if_fail (host != NULL);

	identifier = moonlight_plugin.mozilla_funcs->getstringidentifier (name);
	string_to_npvariant (value, &npvalue);
	moonlight_plugin.mozilla_funcs->setproperty (plugin->moz_instance, host, identifier, &npvalue);
}


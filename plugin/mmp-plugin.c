//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

#include <string.h>

#include "mmp-plugin.h"

static MoonlightPlugin moonlight_plugin = { 0, };
static GHashTable *mmp_plugin_instances = NULL;

MoonlightPlugin *
MMP_HANDLE () 
{
	return &moonlight_plugin;
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

// NPN wrapper functions

void
NPN_Version (gint *plugin_major, gint *plugin_minor, gint *netscape_major, gint *netscape_minor)
{
	*plugin_major = NP_VERSION_MAJOR;
	*plugin_minor = NP_VERSION_MINOR;
	*netscape_major = moonlight_plugin.mozilla_funcs.version >> 8;
	*netscape_minor = moonlight_plugin.mozilla_funcs.version & 0xFF;
}

NPError
NPN_GetValue (NPP instance, NPNVariable variable, gpointer r_value)
{
	return moonlight_plugin.mozilla_funcs.getvalue (instance, variable, r_value);
}

NPError
NPN_SetValue (NPP instance, NPPVariable variable, gpointer value)
{
	return moonlight_plugin.mozilla_funcs.setvalue (instance, variable, value);
}

NPError
NPN_GetURL (NPP instance, const gchar *url, const gchar *window)
{
	return moonlight_plugin.mozilla_funcs.geturl (instance, url, window);
}

NPError
NPN_GetURLNotify (NPP instance, const gchar *url, const gchar *window, gpointer notifyData)
{
	return moonlight_plugin.mozilla_funcs.geturlnotify (instance, url, window, notifyData);
}

NPError
NPN_PostURL (NPP instance, const gchar *url, const gchar *window, guint len, const gchar *buf, NPBool file)
{
	return moonlight_plugin.mozilla_funcs.posturl (instance, url, window, len, buf, file);
}

NPError
NPN_PostURLNotify (NPP instance, const gchar *url, const gchar *window,
	guint len, const gchar *buf, NPBool file, gpointer notifyData)
{
	return moonlight_plugin.mozilla_funcs.posturlnotify (instance, url,
		window, len, buf, file, notifyData);
}

NPError
NPN_RequestRead (NPStream *stream, NPByteRange *rangeList)
{
	return moonlight_plugin.mozilla_funcs.requestread (stream, rangeList);
}

NPError
NPN_NewStream (NPP instance, NPMIMEType type, const gchar *window, NPStream **stream_ptr)
{
	return moonlight_plugin.mozilla_funcs.newstream (instance, type, window, stream_ptr);
}

int32_t
NPN_Write (NPP instance, NPStream *stream, int32_t len, gpointer buffer)
{
	return moonlight_plugin.mozilla_funcs.write (instance, stream, len, buffer);
}

NPError
NPN_DestroyStream (NPP instance, NPStream *stream, NPError reason)
{
	return moonlight_plugin.mozilla_funcs.destroystream (instance, stream, reason);
}

void NPN_Status (NPP instance, const gchar *message)
{
	if (strstr (NPN_UserAgent (instance), "Firefox")) {
		moonlight_plugin.mozilla_funcs.status (instance, message);
	}
}

const gchar *
NPN_UserAgent (NPP instance)
{
	return moonlight_plugin.mozilla_funcs.uagent (instance);
}

gpointer 
NPN_MemAlloc (guint size)
{
	return moonlight_plugin.mozilla_funcs.memalloc (size);
}

void
NPN_MemFree (gpointer ptr)
{
	moonlight_plugin.mozilla_funcs.memfree (ptr);
}

guint
NPN_MemFlush (guint size)
{
	return moonlight_plugin.mozilla_funcs.memflush (size);
}

void
NPN_ReloadPlugins (NPBool reloadPages)
{
	moonlight_plugin.mozilla_funcs.reloadplugins (reloadPages);
}

void
NPN_InvalidateRect (NPP instance, NPRect *invalidRect)
{
	moonlight_plugin.mozilla_funcs.invalidaterect (instance, invalidRect);
}

void
NPN_InvalidateRegion (NPP instance, NPRegion invalidRegion)
{
	moonlight_plugin.mozilla_funcs.invalidateregion (instance, invalidRegion);
}

void
NPN_ForceRedraw (NPP instance)
{
	moonlight_plugin.mozilla_funcs.forceredraw (instance);
}

// npruntime wrapper functions

NPIdentifier
NPN_GetStringIdentifier (const NPUTF8 *name)
{
	return moonlight_plugin.mozilla_funcs.getstringidentifier (name);
}

void
NPN_GetStringIdentifiers (const NPUTF8 **names, gint nameCount, NPIdentifier *identifiers)
{
	moonlight_plugin.mozilla_funcs.getstringidentifiers (names, nameCount, identifiers);
}

NPIdentifier
NPN_GetIntIdentifier (gint intid)
{
	return moonlight_plugin.mozilla_funcs.getintidentifier (intid);
}

bool
NPN_IdentifierIsString (NPIdentifier identifier)
{
	return moonlight_plugin.mozilla_funcs.identifierisstring (identifier);
}

NPUTF8 *
NPN_UTF8FromIdentifier (NPIdentifier identifier)
{
	return moonlight_plugin.mozilla_funcs.utf8fromidentifier (identifier);
}

gint
NPN_IntFromIdentifier (NPIdentifier identifier)
{
	return moonlight_plugin.mozilla_funcs.intfromidentifier (identifier);
}

NPObject *
NPN_CreateObject (NPP npp, NPClass *aClass)
{
	return moonlight_plugin.mozilla_funcs.createobject (npp, aClass);
}

NPObject *
NPN_RetainObject (NPObject *obj)
{
	return moonlight_plugin.mozilla_funcs.retainobject (obj);
}

void
NPN_ReleaseObject (NPObject *obj)
{
	return moonlight_plugin.mozilla_funcs.releaseobject (obj);
}

bool
NPN_Invoke (NPP npp, NPObject *obj, NPIdentifier methodName,
	const NPVariant *args, guint argCount, NPVariant *result)
{
	return moonlight_plugin.mozilla_funcs.invoke (npp, obj, methodName, args, argCount, result);
}

bool
NPN_InvokeDefault (NPP npp, NPObject *obj, const NPVariant *args, 
	guint argCount, NPVariant *result)
{
	return moonlight_plugin.mozilla_funcs.invokeDefault (npp, obj, args, argCount, result);
}

bool
NPN_Evaluate (NPP npp, NPObject *obj, NPString *script, NPVariant *result)
{
	return moonlight_plugin.mozilla_funcs.evaluate (npp, obj, script, result);
}

bool
NPN_GetProperty (NPP npp, NPObject *obj, NPIdentifier propertyName, NPVariant *result)
{
	return moonlight_plugin.mozilla_funcs.getproperty (npp, obj, propertyName, result);
}

bool
NPN_SetProperty (NPP npp, NPObject *obj, NPIdentifier propertyName, const NPVariant *value)
{
	return moonlight_plugin.mozilla_funcs.setproperty (npp, obj, propertyName, value);
}

bool
NPN_RemoveProperty (NPP npp, NPObject *obj, NPIdentifier propertyName)
{
	return moonlight_plugin.mozilla_funcs.removeproperty (npp, obj, propertyName);
}

bool
NPN_HasProperty (NPP npp, NPObject *obj, NPIdentifier propertyName)
{
	return moonlight_plugin.mozilla_funcs.hasproperty (npp, obj, propertyName);
}

bool
NPN_Enumerate (NPP npp, NPObject *obj, NPIdentifier **values, guint *count)
{
	return moonlight_plugin.mozilla_funcs.enumerate (npp, obj, values, count);
}

bool
NPN_HasMethod (NPP npp, NPObject *obj, NPIdentifier methodName)
{
	return moonlight_plugin.mozilla_funcs.hasmethod (npp, obj, methodName);
}

void
NPN_ReleaseVariantValue (NPVariant *variant)
{
	moonlight_plugin.mozilla_funcs.releasevariantvalue (variant);
}

void NPN_SetException (NPObject *obj, const NPUTF8 *message)
{
	moonlight_plugin.mozilla_funcs.setexception (obj, message);
}


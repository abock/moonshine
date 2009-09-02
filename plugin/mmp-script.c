//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

#include <config.h>

#include <string.h>

#include "mmp-script.h"

#define LOAD_IDENTIFIERS() { if (!identifiers_loaded) load_identifiers (); }

static gboolean identifiers_loaded = FALSE;
static NPIdentifier id_document;
static NPIdentifier id_get_element_by_id;
static NPIdentifier id_create_element;
static NPIdentifier id_create_text_node;
static NPIdentifier id_append_child;

static void
load_identifiers ()
{
	id_document = NPN_GetStringIdentifier ("document");
	id_get_element_by_id = NPN_GetStringIdentifier ("getElementById");
	id_create_element = NPN_GetStringIdentifier ("createElement");
	id_create_text_node = NPN_GetStringIdentifier ("createTextNode");
	id_append_child = NPN_GetStringIdentifier ("appendChild");

	identifiers_loaded = TRUE;
}

static gboolean
invoke_in_s_out_o (NPP npp, NPVariant *object, NPIdentifier method, const gchar *in_s, NPVariant *out_o)
{
	NPVariant string;
	STRINGZ_TO_NPVARIANT (in_s, string);
	VOID_TO_NPVARIANT (*out_o);

	if (!NPN_Invoke (npp, NPVARIANT_TO_OBJECT (*object), method, &string, 1, out_o) ||
		!NPVARIANT_IS_OBJECT (*out_o)) {
		NPN_ReleaseVariantValue (out_o);
		return FALSE;
	}

	return TRUE;
}

static gboolean
get_element_property_object (NPP npp, NPObject *object, NPIdentifier property, NPVariant *child)
{
	VOID_TO_NPVARIANT (*child);

	if (!NPN_GetProperty (npp, object, property, child) ||
		!NPVARIANT_IS_OBJECT (*child)) {
		NPN_ReleaseVariantValue (child);
		return FALSE;
	}

	return TRUE;
}

NPObject *
mmp_script_get_window (NPP npp)
{
	NPObject *window;
	g_return_val_if_fail (NPN_GetValue (npp, 
		NPNVWindowNPObject, &window) == NPERR_NO_ERROR, NULL);
	return window;
}

gboolean
mmp_script_get_document (NPP npp, NPObject *window, NPVariant *document)
{
	LOAD_IDENTIFIERS ();
	return get_element_property_object (npp, window, id_document, document);
}

gboolean
mmp_script_element_get_property_object (NPP npp, NPVariant *element, 
	const gchar *property_name, NPVariant *property_object)
{
	return get_element_property_object (npp, NPVARIANT_TO_OBJECT (*element),
		NPN_GetStringIdentifier (property_name), property_object);
}

gboolean
mmp_script_element_set_property_string (NPP npp, NPVariant *element,
	const gchar *property_name, const gchar *property_value)
{
	NPVariant string;
	STRINGZ_TO_NPVARIANT (property_value, string);
	return NPN_SetProperty (npp, NPVARIANT_TO_OBJECT (*element), 
		NPN_GetStringIdentifier (property_name), &string);
}

gboolean
mmp_script_document_create_element (NPP npp, NPVariant *document, 
	const gchar *element_name, NPVariant *element)
{
	LOAD_IDENTIFIERS ();
	return invoke_in_s_out_o (npp, document, id_create_element, element_name, element);
}

gboolean
mmp_script_document_create_text_node (NPP npp, NPVariant *document, 
	const gchar *text_data, NPVariant *element)
{
	LOAD_IDENTIFIERS ();
	return invoke_in_s_out_o (npp, document, id_create_text_node, text_data, element);
}

gboolean
mmp_script_document_get_element_by_id (NPP npp, NPVariant *document,
	const gchar *id, NPVariant *element)
{
	LOAD_IDENTIFIERS ();
	return invoke_in_s_out_o (npp, document, id_get_element_by_id, id, element);
}

gboolean
mmp_script_element_append_child (NPP npp, NPVariant *element, NPVariant *child)
{
	gboolean success;
	NPVariant result;
	VOID_TO_NPVARIANT (result);

	LOAD_IDENTIFIERS ();

	success = NPN_Invoke (npp, NPVARIANT_TO_OBJECT (*element), id_append_child, child, 1, &result);
	NPN_ReleaseVariantValue (&result);
	return success;
}

gboolean
mmp_script_evaluate (NPP npp, const gchar *code)
{
	NPObject *host;
	NPString string;
	NPVariant output;
	gboolean result;

	g_return_val_if_fail (npp != NULL, FALSE);
	g_return_val_if_fail (NPN_GetValue (npp, NPNVWindowNPObject, 
		&host) == NPERR_NO_ERROR, FALSE);

	string.utf8characters = code;
	string.utf8length = strlen (code);

	if ((result = NPN_Evaluate (npp, host, &string, &output))) {
		NPN_ReleaseVariantValue (&output);
	}

	NPN_ReleaseObject (host);
	return result;
}


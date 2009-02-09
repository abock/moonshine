#include <string.h>

#include "mmp-binder.h"
#include "mmp-script.h"
#include "mmp-resources.h"

#define MLMP_XAML_LOAD_FUNCTION "__MoonshineWmpPluginBindInstance"
#define MLMP_XAML_DOM_ID        "__MoonshineEmptyFakeXamlTrickery"

typedef enum {
	XAML_LOAD_ERROR = 0,
	XAML_LOAD_SUCCESS = 1,
	XAML_LOAD_ALREADY_LOADED = 2
} XamlLoadStatus;

static XamlLoadStatus
mmp_binder_load_player_xaml (MoonlightPluginInstance *plugin)
{
	NPP npp = plugin->moz_instance;
	NPObject *window = mmp_script_get_window (npp);
	NPVariant document;
	NPVariant script_element;
	NPVariant xaml_node;
	NPVariant body;
	XamlLoadStatus xaml_loaded = XAML_LOAD_ERROR;

	g_return_val_if_fail (npp != NULL, XAML_LOAD_ERROR);
	g_return_val_if_fail (window != NULL, XAML_LOAD_ERROR);

	// Load the document object
	if (!mmp_script_get_document (npp, window, &document)) {
		mp_error ("Unable to get document object via npruntime");
		return XAML_LOAD_ERROR;
	}

	// Check to see if the XAML was already loaded into the DOM
	if (mmp_script_document_get_element_by_id (npp, &document, MLMP_XAML_DOM_ID, &xaml_node)) {
		NPN_ReleaseVariantValue (&xaml_node);
		NPN_ReleaseVariantValue (&document);
		return XAML_LOAD_ALREADY_LOADED;
	}

	// Create the XAML and add to the DOM (<script id='foo' type='text/xaml'>[xaml data]</script>)
	if (mmp_script_document_create_element (npp, &document, "script", &script_element)) {
		if (mmp_script_element_set_property_string (npp, &script_element, "id", MLMP_XAML_DOM_ID) &&
			mmp_script_element_set_property_string (npp, &script_element, "type", "text/xaml") &&
			mmp_script_document_create_text_node (npp, &document, "<Canvas/>", &xaml_node)) {
			
			if (mmp_script_element_append_child (npp, &script_element, &xaml_node)) {
				if (mmp_script_element_get_property_object (npp, &document, "body", &body)) {
					if (mmp_script_element_append_child (npp, &body, &script_element)) {
						xaml_loaded = XAML_LOAD_SUCCESS;
					}

					NPN_ReleaseVariantValue (&body);
				}
			} 

			NPN_ReleaseVariantValue (&xaml_node);
		}

		NPN_ReleaseVariantValue (&script_element);
	}

	NPN_ReleaseVariantValue (&document);
	return xaml_loaded;
}

static void
mmp_binder_bind (MoonlightPluginInstance *plugin)
{
	XamlLoadStatus status;

	status = mmp_binder_load_player_xaml (plugin);

	if (status == XAML_LOAD_ERROR) {
		mp_error ("Unable to load player XAML into the DOM");
		return;
	} else if (status == XAML_LOAD_SUCCESS) {
		// Only load the JS once, when the XAML is actually added to the DOM
		gint i = 0;
		for (; MLMP_RESOURCES_ALL[i]; i++) {
			mmp_script_evaluate (plugin->moz_instance, MLMP_RESOURCES_ALL[i]);
		}
	}
}

NPError mmp_binder_npp_new (NPMIMEType pluginType, NPP instance, gushort mode,
	gshort argc, gchar **argn, gchar **argv, NPSavedData *saved)
{
	NPError result;
	gchar **param_names;
	gchar **param_values;
	gint param_count = 0, i;
	MoonlightPluginInstance *plugin;

	mp_debug ("NPP_New");

	// +2 to ensure space for onload and source
	param_names = g_new0 (gchar *, argc + 2);
	param_values = g_new0 (gchar *, argc + 2);

	// We only preserve and proxy id, width, and height
	for (i = 0; i < argc; i++) {
		if (g_ascii_strncasecmp (argn[i], "id", 2) == 0 ||
			g_ascii_strncasecmp (argn[i], "width", 5) == 0 ||
			g_ascii_strncasecmp (argn[i], "height", 6) == 0) {
			param_names[param_count] = g_strdup (argn[i]);
			param_values[param_count] = g_strdup (argv[i]);
			param_count++;
		}
	}

	param_names[param_count] = g_strdup ("source");
	param_values[param_count++] = g_strdup ( "#" MLMP_XAML_DOM_ID );

	param_names[param_count] = g_strdup ("onload");
	param_values[param_count++] = g_strdup (MLMP_XAML_LOAD_FUNCTION);
	
	// Create an NPP wrapper and send the NPP_New to Moonlight
	plugin = mmp_plugin_new (instance);
	plugin->param_names = param_names;
	plugin->param_values = param_values;

	result = MMP_HANDLE ()->moon_npp_new ("application/x-silverlight", instance, mode, 
		param_count, param_names, param_values, saved);	

	if (result == NPERR_NO_ERROR) {
		// Everything was okay, so bind XAML and JS to the plugin instance
		mmp_binder_bind (plugin);
		return NPERR_NO_ERROR;
	}

	mmp_plugin_free (plugin);

	return result;
}

NPError
mmp_binder_npp_destroy (NPP instance, NPSavedData **save)
{
	MoonlightPluginInstance *plugin;
	
	mp_debug ("NPP_Destroy");

	plugin = mmp_plugin_find_instance (instance);
	if (plugin != NULL) {
		mmp_plugin_free (plugin);
	}

	return MMP_HANDLE ()->moon_npp_destroy (instance, save);
}

void
mmp_binder_npp_stream_as_file (NPP instance, NPStream *stream, const gchar *fname)
{
	// Mozilla ends up calling this in some cases. It results in the file
	// being loaded as XAML inside of Moonlight, which is very bad since
	// it's going to be some kind of WM content.
	//
	// Observed cases where Mozilla does this:
	//
	//    <embed src="..." />
	//    <object data="..." />
	//
}


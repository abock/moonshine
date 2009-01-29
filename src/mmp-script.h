#ifndef _MMP_SCRIPT_H
#define _MMP_SCRIPT_H

#include <glib.h>
#include <npupp.h>

NPObject * mmp_script_get_window                  (NPP npp);
gboolean   mmp_script_get_document                (NPP npp, NPObject *window, NPVariant *document);
gboolean   mmp_script_element_get_property_object (NPP npp, NPVariant *element, 
                                                   const gchar *property_name, NPVariant *property_object);
gboolean   mmp_script_element_set_property_string (NPP npp, NPVariant *element,
                                                   const gchar *property_name, const gchar *property_value);
gboolean   mmp_script_document_create_element     (NPP npp, NPVariant *document, 
                                                   const gchar *element_name, NPVariant *element);
gboolean   mmp_script_document_create_text_node   (NPP npp, NPVariant *document, 
                                                   const gchar *text_data, NPVariant *element);
gboolean   mmp_script_document_get_element_by_id  (NPP npp, NPVariant *document,
                                                   const gchar *id, NPVariant *element);
gboolean   mmp_script_element_append_child        (NPP npp, NPVariant *element, NPVariant *child);
gboolean   mmp_script_evaluate                    (NPP npp, const gchar *code);

#endif /* _MMP_SCRIPT_H */


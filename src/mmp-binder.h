#ifndef _MMP_BINDER_H
#define _MMP_BINDER_H

#include "mmp-plugin.h"

NPError mmp_binder_npp_new (NPMIMEType pluginType, NPP instance, gushort mode,
	gshort argc, gchar **argn, gchar **argv, NPSavedData *saved);

NPError mmp_binder_npp_destroy (NPP instance, NPSavedData **save);

gboolean mmp_binder_npn_setproperty (NPP npp, NPObject *obj, NPIdentifier propertyName, const NPVariant *value);

#endif /* _MMP_BINDER_H */


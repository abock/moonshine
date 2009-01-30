#ifndef _MMP_BINDER_H
#define _MMP_BINDER_H

#include "mmp-plugin.h"

NPError mmp_binder_npp_new (NPMIMEType pluginType, NPP instance, gushort mode,
	gshort argc, gchar **argn, gchar **argv, NPSavedData *saved);

NPError mmp_binder_npp_destroy (NPP instance, NPSavedData **save);

void mmp_binder_npp_stream_as_file (NPP instance, NPStream *stream, const gchar *fname);

#endif /* _MMP_BINDER_H */


//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

#ifndef _MMP_BINDER_H
#define _MMP_BINDER_H

#include "mmp-plugin.h"

G_BEGIN_DECLS

NPError mmp_binder_npp_new (NPMIMEType pluginType, NPP instance, gushort mode,
	gshort argc, gchar **argn, gchar **argv, NPSavedData *saved);

NPError mmp_binder_npp_destroy (NPP instance, NPSavedData **save);

void mmp_binder_npp_stream_as_file (NPP instance, NPStream *stream, const gchar *fname);

G_END_DECLS

#endif /* _MMP_BINDER_H */


/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: t; c-basic-offset: 8 -*- */
/*
 * plugin-embedded-media.h: hooks to implement embedded media through a XAML mapping
 *
 * Contact:
 *   Moonlight List (moonlight-list@lists.ximian.com)
 *
 * Copyright 2008 Novell, Inc. (http://www.novell.com)
 *
 * See the LICENSE file included with the distribution for details.
 *
 */

#ifndef PLUGIN_EMBEDDED_MEDIA
#define PLUGIN_EMBEDDED_MEDIA

void * plugin_embedded_media_stream_as_file_hook (void *plugin, NPStream *stream, const char *source_location);

#endif /* PLUGIN_EMBEDDED_MEDIA */

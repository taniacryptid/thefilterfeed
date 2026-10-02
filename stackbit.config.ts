// Netlify Visual Editor config (Git CMS). Edits to the markdown posts in
// content/posts/ are committed straight back to the repo. Posts written in the
// in-site editor (/admin) live in Netlify Database and are not covered here.
import { defineStackbitConfig, type SiteMapEntry } from '@stackbit/types'
import { GitContentSource } from '@stackbit/cms-git'

// Same slug rule as content-collections.ts: URLs come from the title, not the filename.
const slugify = (title: string) => title.toLowerCase().replace(/[^\w-]+/g, '_')

export default defineStackbitConfig({
  stackbitVersion: '~0.6.0',
  ssgName: 'custom',
  nodeVersion: '22',
  devCommand: 'npx vite dev --port {PORT} --host 0.0.0.0',
  contentSources: [
    new GitContentSource({
      rootPath: __dirname,
      contentDirs: ['content/posts'],
      models: [
        {
          name: 'Post',
          type: 'page',
          label: 'Field note',
          filePath: 'content/posts/{slug}.md',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'summary', type: 'string' },
            { name: 'date', type: 'date', required: true },
            { name: 'categories', type: 'list', items: { type: 'string' } },
            // Filename inside public/img/ (served through the Image CDN).
            { name: 'image', type: 'string', required: true },
            { name: 'markdown_content', type: 'markdown', label: 'Body' },
          ],
        },
      ],
      assetsConfig: {
        referenceType: 'static',
        staticDir: 'public',
        uploadDir: 'img',
        publicPath: '/',
      },
    }),
  ],
  siteMap: ({ documents }) =>
    documents
      .filter((doc) => doc.modelName === 'Post')
      .map((doc): SiteMapEntry => {
        const field = doc.fields.title
        const title = field && 'value' in field && typeof field.value === 'string' ? field.value : doc.id
        return {
          stableId: doc.id,
          label: title,
          urlPath: `/posts/${slugify(title)}`,
          document: doc,
          isHomePage: false,
        }
      }),
})

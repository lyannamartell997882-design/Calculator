import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';

// tslint:disable-next-line:no-default-export
export default defineConfig({
  plugins: [tailwindcss()],
  define: {
    // TODO(b/491815199): Remove this once we have a way to get a maps API key.
    __MAPS_API_KEY__: JSON.stringify('AIzaSyBwFw8nficXaDBwQnZOiei26qTNwkjXYiA'),
  },
});


import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      alias: '/',
      component: () => import('@/views/HomeScreen.vue'),
    },
    {
      path: '/sadebugger',
      name: 'Spelling Algebra Debugger',
      alias: '/debugger',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/SpellingAlgebraDebugger.vue'),
    },
    {
      path: '/plum',
      name: 'The Plum',
      alias: ['/Plum'],
      component: () => import('@/views/ThePlum.vue'),
    },
    {
      path: '/credits',
      name: 'Credits',
      alias: ['/Credits'],
      component: () => import('@/views/TheCredits.vue'),
    },
    {
      path: '/cseditor',
      name: 'Color Scheme Editor',
      alias: ['/editor'],
      component: () => import('@/views/ColorSchemeEditor.vue'),
    },
  ],
});

export default router;

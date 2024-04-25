import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        auth: undefined
      }
    },
    {
      path: '/tablo',
      name: 'tablo',
      component: () => import('../views/TabloView.vue'),
      meta: {
        auth: undefined
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        auth: false
      }
    },
    {
      path: '/account/profile',
      name: 'profile',
      component: () => import('../views/Account/ProfileView.vue'),
      meta: {
        auth: true
      }
    },
    {
      path: '/queue/operator/settings',
      name: 'operator_settings',
      component: () => import('../views/OperatorSettingsView.vue'),
      meta: {
        auth: true
      }
    },
    {
      path: '/queue/operator',
      name: 'operator',
      component: () => import('../views/OperatorView.vue'),
      meta: {
        auth: true
      }
    },
    {
      path: '/queue/registrator',
      name: 'registrator',
      component: () => import('../views/RegistatorView.vue'),
      meta: {
        auth: true
      }
    }
  ]
})

export default router

import './assets/main.css'
import 'bulma/css/bulma.css'
import '@ntohq/buefy-next/dist/buefy.css'
import { createApp } from 'vue/dist/vue.esm-bundler'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Buefy from '@ntohq/buefy-next'
import auth from '@/auth'
import apolloClient from '@/apollo'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { h, provide } from 'vue'

const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient)
  },
  render: () => h(App)
})
const pinia = createPinia()

app.use(Buefy)
app.use(pinia)
app.use(router)
app.use(auth)

app.mount('#app')

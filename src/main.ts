import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { mountApp } from './ui/app'

registerSW()
mountApp(document.getElementById('app')!)

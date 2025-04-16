import React from 'react'
import "../global.css"
import { Redirect } from 'expo-router'
export default function index() {
  return <Redirect href="/(auth)/login"/>;
}
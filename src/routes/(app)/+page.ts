import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

// The legacy app opened on the Acordes view.
export function load() {
  redirect(307, resolve('/(app)/acordes'));
}

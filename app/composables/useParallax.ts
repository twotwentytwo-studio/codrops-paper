const QUERY = '(min-width: 650px)'

export const useParallax = () => {
	const { $mouse } = useNuxtApp()

	const on = ref(false)

	onMounted(() => {
		if (!$mouse) return

		const mql = window.matchMedia(QUERY)

		on.value = mql.matches

		const read = () => { on.value = mql.matches }

		mql.addEventListener('change', read)
		onScopeDispose(() => mql.removeEventListener('change', read))
	})

	return on
}

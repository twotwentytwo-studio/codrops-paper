const QUERY = '(hover: hover) and (pointer: fine) and (min-width: 650px)'

export const useParallax = () => {
	const on = ref(false)

	onMounted(() => {
		const mql = window.matchMedia(QUERY)

		on.value = mql.matches

		const read = () => { on.value = mql.matches }

		mql.addEventListener('change', read)
		onScopeDispose(() => mql.removeEventListener('change', read))
	})

	return on
}

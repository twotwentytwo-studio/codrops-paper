const SNAPPY = [0, 0.0191, 0.062, 0.1566, 0.3378, 0.5335, 0.6892, 0.8, 0.8686, 0.912, 0.9469, 0.964, 0.9741, 0.981, 0.9859, 0.9896, 0.9923, 0.9946, 0.9961, 0.9976, 0.9984, 0.9991, 0.9996, 0.9998, 1]

export const snappy = (t: number) => {
	const x = Math.min(1, Math.max(0, t)) * (SNAPPY.length - 1)
	const i = Math.min(Math.floor(x), SNAPPY.length - 2)

	return SNAPPY[i]! + (SNAPPY[i + 1]! - SNAPPY[i]!) * (x - i)
}

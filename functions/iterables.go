package functions

func MapArrayInsert[K comparable, V any](m map[K][]V, k K, v V) {
	l, ok := m[k]
	if !ok {
		m[k] = []V{v}
	} else {
		m[k] = append(l, v)
	}
}

func Keys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

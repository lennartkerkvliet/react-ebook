import { useReader } from "../components/reader"

export function useBookNavigator() {
    const { goTo, next, previous } = useReader()
    return { goTo, next, previous }
}
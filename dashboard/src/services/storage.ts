// Acceso seguro a localStorage (puede no estar disponible en modo privado).
const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* sin almacenamiento: el valor solo vive en memoria */
  }
}

export const getFanTeam = () => read('xo_fan_team')
export const setFanTeam = (abbr: string) => write('xo_fan_team', abbr)
export const getUsername = () => read('xo_username')
export const setUsername = (name: string) => write('xo_username', name)

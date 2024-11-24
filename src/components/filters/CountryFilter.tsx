import { filterProps } from './filterReducer'
import BaseFilter from './BaseFilter'
import { LucideGlobe, LucideTrash2 } from 'lucide-react'
import { useMemo } from 'react'
import { Incident } from '@/types'

const CountryFilter = ({ id, data, state, dispatch }: filterProps) => {
  function stateWrapper<T>(key: string, defaultValue: T): [T, (func: (state: T) => T) => void] {
    const value = state?.[key] ?? defaultValue
    const setValue = (func: (state: T) => T) => {
      const prev = state[key] ?? defaultValue
      const newState = func(prev)
      dispatch({ type: 'UPDATE_FILTER', payload: { id, update: (filter) => ({ ...filter, state: { ...filter.state, [key]: newState } }) } })
    }
    return [value, setValue]
  }
  const [hiddenCountries, setHiddenCountries] = stateWrapper<string[]>('hiddenCountries', [])
  const [hiddenDepartments, setHiddenDepartments] = stateWrapper<string[]>('hiddenDepartments', [])
  const [hiddenMunicipalities, setHiddenMunicipalities] = stateWrapper<string[]>('hiddenMunicipalities', [])

  const departmentsByCountry = useMemo(() => {
    return Object.entries(data.filterBounds.locations).reduce(
      (acc, [country, departments]) => {
        acc[country] = Object.keys(departments)
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [data.filterBounds.locations])

  const handleCountryChange = (country: string, makeVisible: boolean) => {
    // Clobber the state of its decendants
    setHiddenDepartments((prev) => prev.filter((d) => !d.startsWith(country)))
    setHiddenMunicipalities((prev) => prev.filter((m) => !m.startsWith(country)))
    // Set the state of the country
    setHiddenCountries((prev) => (makeVisible ? prev.filter((c) => c !== country) : [...prev, country]))
  }

  const handleDepartmentChange = (country: string, department: string, makeVisible: boolean) => {
    const key = `${country} - ${department}`
    // Trying to show a department, but it isn't hidden (country is hidden)
    if (makeVisible && !hiddenDepartments.includes(key)) {
      // Then show the country but hide every other department in it
      handleCountryChange(country, true)
      setHiddenDepartments((prev) => [...prev, ...departmentsByCountry[country].map((d) => `${country} - ${d}`)])
    }
    // Clobber the state of its municipalities
    setHiddenMunicipalities((prev) => prev.filter((m) => !m.startsWith(key)))
    // If all departments would be hidden, hide the country instead
    if (!makeVisible && hiddenDepartments.filter((d) => d.startsWith(country)).length + 1 === departmentsByCountry[country].length) {
      handleCountryChange(country, false)
    } else {
      setHiddenDepartments((prev) => (makeVisible ? prev.filter((d) => d !== key) : [...prev, key]))
    }
  }

  const handleMunicipalityChange = (country: string, department: string, municipality: string, makeVisible: boolean) => {
    const key = `${country} - ${department} - ${municipality}`
    // Trying to show a municipality, but it isn't hidden (country or department is hidden)
    if (makeVisible && !hiddenMunicipalities.includes(key)) {
      // Then show the department but hide every other municipality in it
      handleDepartmentChange(country, department, true)
      setHiddenMunicipalities((prev) => [
        ...prev,
        ...data.filterBounds.locations[country][department].map((m) => `${country} - ${department} - ${m}`),
      ])
    }
    // If all municipalities would be hidden, hide the department instead
    if (
      !makeVisible &&
      hiddenMunicipalities.filter((m) => m.startsWith(`${country} - ${department}`)).length + 1 ===
        data.filterBounds.locations[country][department].length
    ) {
      handleDepartmentChange(country, department, false)
    } else {
      setHiddenMunicipalities((prev) => (makeVisible ? prev.filter((m) => m !== key) : [...prev, key]))
    }
  }

  const applyFilters = () => {
    const incidentNotHidden = (incident: Incident) =>
      !hiddenCountries.includes(incident.country) &&
      !hiddenDepartments.includes(`${incident.country} - ${incident.department}`) &&
      !hiddenMunicipalities.includes(`${incident.country} - ${incident.department} - ${incident.municipality}`)

    dispatch({
      type: 'UPDATE_FILTER',
      payload: {
        id: id,
        operation: incidentNotHidden,
      },
    })
  }

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  const filterString = []
  if (hiddenCountries.length === 1) {
    filterString.push(`1 país oculto`)
  } else if (hiddenCountries.length > 1) {
    filterString.push(`${hiddenCountries.length} países ocultos`)
  }
  if (hiddenDepartments.length === 1) {
    filterString.push(`1 departamento oculto`)
  } else if (hiddenDepartments.length > 1) {
    filterString.push(`${hiddenDepartments.length} departamentos ocultos`)
  }
  if (hiddenMunicipalities.length === 1) {
    filterString.push(`1 municipio oculto`)
  } else if (hiddenMunicipalities.length > 1) {
    filterString.push(`${hiddenMunicipalities.length} municipios ocultos`)
  }
  if (filterString.length === 0) {
    filterString.push('ningún filtro aplicado')
  }

  return (
    <BaseFilter icon={<LucideGlobe />} text={'Áreas: ' + filterString.join(', ')}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <div className="p-2">
        {Object.entries(data.filterBounds.locations).map(([country, departments]) => (
          <details key={country}>
            <summary>
              <input
                type="checkbox"
                checked={!hiddenCountries.includes(country)}
                onChange={(e) => handleCountryChange(country, e.target.checked)}
                className="mr-2"
              />
              {country}
            </summary>
            <div className="pl-4">
              {Object.keys(departments).map((department) => (
                <details key={department}>
                  <summary>
                    <input
                      type="checkbox"
                      checked={!hiddenCountries.includes(country) && !hiddenDepartments.includes(`${country} - ${department}`)}
                      onChange={(e) => handleDepartmentChange(country, department, e.target.checked)}
                      className="mr-2"
                    />
                    {department}
                  </summary>
                  <ul>
                    {departments[department].map((municipality) => (
                      <li key={municipality} className="pl-4">
                        <input
                          type="checkbox"
                          checked={
                            !hiddenCountries.includes(country) &&
                            !hiddenDepartments.includes(`${country} - ${department}`) &&
                            !hiddenMunicipalities.includes(`${country} - ${department} - ${municipality}`)
                          }
                          onChange={(e) => handleMunicipalityChange(country, department, municipality, e.target.checked)}
                          className="mr-2"
                        />
                        {municipality}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </details>
        ))}
        <button onClick={applyFilters} className="mt-4 rounded bg-blue-500 px-2 py-1 text-white">
          Aplicar
        </button>
      </div>
    </BaseFilter>
  )
}

export default CountryFilter

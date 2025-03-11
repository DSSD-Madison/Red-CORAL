import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideGlobe, LucideTrash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDB } from '@/context/DBContext'

interface CountryFilterState extends filterProps {
  state?: {
    hiddenCountries: string[]
    hiddenDepartments: string[]
    hiddenMunicipalities: string[]
  }
}

const CountryFilter = ({ id, dispatch, state }: CountryFilterState) => {
  const { db } = useDB()
  const [hiddenCountries, setHiddenCountries] = useState<string[]>(state?.hiddenCountries || [])
  const [hiddenDepartments, setHiddenDepartments] = useState<string[]>(state?.hiddenDepartments || [])
  const [hiddenMunicipalities, setHiddenMunicipalities] = useState<string[]>(state?.hiddenMunicipalities || [])

  const departmentsByCountry = useMemo(() => {
    return Object.entries(db.filterBounds.locations).reduce(
      (acc, [country, departments]) => {
        acc[country] = Object.keys(departments)
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [db.filterBounds.locations])

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
      setHiddenMunicipalities((prev) => [...prev, ...db.filterBounds.locations[country][department].map((m) => `${country} - ${department} - ${m}`)])
    }
    // If all municipalities would be hidden, hide the department instead
    if (
      !makeVisible &&
      hiddenMunicipalities.filter((m) => m.startsWith(`${country} - ${department}`)).length + 1 ===
        db.filterBounds.locations[country][department].length
    ) {
      handleDepartmentChange(country, department, false)
    } else {
      setHiddenMunicipalities((prev) => (makeVisible ? prev.filter((m) => m !== key) : [...prev, key]))
    }
  }

  const selectAllCountries = (selectAll: boolean) => {
    if (selectAll) {
      setHiddenCountries([])
      setHiddenDepartments([])
      setHiddenMunicipalities([])
    } else {
      setHiddenCountries(Object.keys(db.filterBounds.locations))
      setHiddenDepartments(
        Object.entries(db.filterBounds.locations).flatMap(([country, departments]) => Object.keys(departments).map((dept) => `${country} - ${dept}`))
      )
      setHiddenMunicipalities(
        Object.entries(db.filterBounds.locations).flatMap(([country, departments]) =>
          Object.entries(departments).flatMap(([dept, municipalities]) => municipalities.map((muni) => `${country} - ${dept} - ${muni}`))
        )
      )
    }
  }

    const removeThisFilter = () => {
      dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
    }

    const parts: string[] = []

    if (hiddenCountries.length > 0) {
      parts.push(hiddenCountries.length === 1 ? '1 país oculto' : `${hiddenCountries.length} países ocultos`)
    }
    if (hiddenDepartments.length > 0) {
      parts.push(hiddenDepartments.length === 1 ? '1 departamento oculto' : `${hiddenDepartments.length} departamentos ocultos`)
    }
    if (hiddenMunicipalities.length > 0) {
      parts.push(hiddenMunicipalities.length === 1 ? '1 municipio oculto' : `${hiddenMunicipalities.length} municipios ocultos`)
    }

    const filterStringDisplay = parts.length ? `: ${parts.join(', ')}` : ''

    return (
      <BaseFilter icon={<LucideGlobe />} text={'Áreas' + filterStringDisplay} scrollOverflow={true}>
        <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
          <LucideTrash2 size={20} />
        </button>
        <div className="p-2">
          <button onClick={() => selectAllCountries(true)} className="mb-2 mr-2 rounded bg-neutral-500 px-2 py-1 text-white">
            Seleccionar todo
          </button>
          <button onClick={() => selectAllCountries(false)} className="mb-2 mr-4 rounded bg-neutral-500 px-2 py-1 text-white">
            Deseleccionar todo
          </button>
          {Object.entries(db.filterBounds.locations).map(([country, departments]) => (
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
                        <li key={municipality} className="pl-6">
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
          <button
            onClick={() =>
              dispatch({
                type: 'UPDATE_FILTER',
                payload: {
                  id: id,
                  state: { hiddenCountries, hiddenDepartments, hiddenMunicipalities },
                },
              })
            }
            className="mt-4 rounded bg-blue-500 px-2 py-1 text-white"
          >
            Aplicar
          </button>
        </div>
      </BaseFilter>
    )
}

export default CountryFilter

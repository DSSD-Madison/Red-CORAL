import { DB, Incident } from 'types'
import { useMap } from 'react-leaflet'
import { ChangeEvent, useEffect, useState } from 'react'

interface InfoPanelControlProps {
  data: DB
  incidentID: keyof DB['Incidents'] | null
  onClose: () => void
  submitIncident: (
    name: Incident['name'],
    dateString: Incident['dateString'],
    typeID: Incident['typeID'],
    country: Incident['country'],
    department: Incident['department'],
    municipality: Incident['municipality'],
    description: Incident['description']
  ) => Promise<boolean>
  setLocation: React.Dispatch<React.SetStateAction<Incident['location'] | null>>
  tmpSelected: boolean
  setTmpSelected: React.Dispatch<React.SetStateAction<boolean>>
  isAdmin: boolean
  deleteSelectedIncident: () => void
}

const InfoPanelControl: React.FC<InfoPanelControlProps> = ({
  data,
  incidentID,
  onClose,
  submitIncident,
  setLocation,
  tmpSelected,
  isAdmin,
  deleteSelectedIncident,
}) => {
  const map = useMap()
  const [name, setName] = useState<Incident['name']>('')
  const [description, setDescription] = useState<Incident['description']>('')
  const [country, setCountry] = useState<Incident['country']>('')
  const [municipality, setMunicipality] = useState<Incident['municipality']>('')
  const [department, setDepartment] = useState<Incident['department']>('')
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [municipalityOptions, setMunicipalityOptions] = useState<string[]>([])
  const [dateString, setDateString] = useState<Incident['dateString']>('')
  const [typeID, setTypeID] = useState<keyof DB['Types']>('')
  const [catID, setCatID] = useState<keyof DB['Categories']>('')

  useEffect(() => {
    if (!country) {
      setShowDepartmentDropdown(false)
      return // No country selected yet
    }

    fetch('data.json')
      .then((response) => response.json())
      .then((data) => {
        if (data[country.charAt(0).toUpperCase() + country.slice(1)]) {
          data[country.charAt(0).toUpperCase() + country.slice(1)]['Other'] = ['Other']
          const departments = Object.keys(data[country])
          setDepartmentOptions([...departments])
          setShowDepartmentDropdown(true)
        } else {
          setDepartmentOptions([])
          setShowDepartmentDropdown(false)
        }
      })
      .catch((error) => {
        console.error('Error loading data.json:', error)
      })
  }, [country])

  useEffect(() => {
    if (!department) {
      return // No department selected yet
    }

    fetch('data.json')
      .then((response) => response.json())
      .then((data) => {
        data[country.charAt(0).toUpperCase() + country.slice(1)]['Other'] = ['Other']
        if (data[country] && data[country][department]) {
          console.log(data)
          setMunicipalityOptions([...data[country][department]])
        } else {
          setMunicipalityOptions([])
        }
      })
      .catch((error) => {
        console.error('Error loading data.json:', error)
      })
  }, [department])

  const handleCountryChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = e.target.value
    setCountry(selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1))
    setDepartment('')
    setMunicipality('')
  }

  const handleDepartmentChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
    const selectedDepartment = e.target.value
    setDepartment(selectedDepartment.charAt(0).toUpperCase() + selectedDepartment.slice(1))
    setMunicipality('')
  }

  const handleMunicipalityChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
    const selectedMunicipality = e.target.value
    setMunicipality(selectedMunicipality.charAt(0).toUpperCase() + selectedMunicipality.slice(1))
  }

  const disableZoom = () => {
    map.scrollWheelZoom.disable()
    map.dragging.disable()
  }

  const enableZoom = () => {
    map.scrollWheelZoom.enable()
    map.dragging.enable()
  }

  const close = () => {
    enableZoom()
    onClose()
  }

  const submit = async () => {
    if (await submitIncident(name, dateString, typeID, description, country, department, municipality)) {
      setName('')
      setDescription('')
      setDateString('')
      setTypeID('')
      setCatID('')
      setCountry('')
      setDepartment('')
      setMunicipality('')
      close()
    }
  }

  const incident = incidentID ? data.Incidents[incidentID] : null

  return (
    <div
      key={'overlay'}
      className={`${
        incident || tmpSelected ? 'w-[100%] md:w-[400px]' : 'w-0'
      } duration-400 fixed left-0 z-[1000] box-border h-screen cursor-default overflow-y-auto rounded-e-xl bg-tint-02/60 !font-proxima-nova shadow-lg backdrop-blur-sm transition-all duration-100`}
      onMouseEnter={disableZoom}
      onMouseLeave={enableZoom}
    >
      {(incident || tmpSelected) && (
        <>
          <span
            className="absolute right-6 top-6 h-4 w-4 cursor-pointer text-center text-2xl font-extrabold leading-4 text-shade-01 transition delay-75 ease-in-out hover:scale-125"
            onClick={close}
          >
            &times;
          </span>

          {incident && (
            <div key={incident.name} className="px-6 py-10">
              <div className="mb-4">
                <span className="inline text-2xl font-bold text-shade-02">{incident.name}</span>
              </div>
              <div className="font-merriweather text-base">
                <div className="mb-4 text-sm text-shade-02">
                  {incident.dateString && (
                    <>
                      Fecha: {incident.dateString} <br />
                    </>
                  )}
                  Actividad: {data.Categories[data.Types[incident.typeID].categoryID].name}
                  <br />
                  Tipo de evento: {data.Types[incident.typeID].name}
                </div>
                <div className="mb-6 text-shade-01">{incident.description}</div>
                País: {incident.country}
                <br />
                Departamento: {incident.department}
                <br />
                Municipio: {incident.municipality}
                <div className="mb-6 text-shade-01"></div>
                {isAdmin && (
                  <button className="mr-1 rounded-sm border-0 bg-red-light pb-1 pl-2 pr-2 pt-1 hover:bg-red" onClick={deleteSelectedIncident}>
                    Borrar
                  </button>
                )}
              </div>
            </div>
          )}
          {tmpSelected && (
            <div className="px-6 py-10">
              <div className="mb-4">
                <span className="inline text-2xl font-bold text-shade-02">
                  Nombre:
                  <br />
                  <input type="text" className="w-full" value={name} onChange={(e) => setName(e.target.value)} required />
                </span>
              </div>
              <div className="font-merriweather text-base">
                <div className="mb-4 text-sm text-shade-02">
                  Fecha:
                  <br />
                  <input type="date" className="w-full" value={dateString} onChange={(e) => setDateString(e.target.value)} required />
                  <br />
                  Actividad:
                  <br />
                  <select
                    value={catID}
                    onChange={(e) => {
                      setCatID(e.target.value)
                      setTypeID('')
                    }}
                    className="w-full"
                  >
                    <option value="">--Por favor elige una actividad--</option>
                    {Object.entries(data.Categories).map(([id, category]) => (
                      <option key={id} value={id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <br />
                  Tipo de evento:
                  <br />
                  <select value={typeID} onChange={(e) => setTypeID(e.target.value)} className="w-full">
                    <option value="">--Por favor elige un tipo de evento--</option>
                    {Object.entries(data.Types).map(
                      ([id, type]) =>
                        type.categoryID == catID && (
                          <option key={id} value={id}>
                            {type.name}
                          </option>
                        )
                    )}
                  </select>
                  <br />
                  <label>
                    País:
                    <br />
                    <input className="w-full" value={country} onChange={handleCountryChange} required />
                  </label>
                  <br />
                  {showDepartmentDropdown ? (
                    <label>
                      Departamento:
                      <br />
                      <select className="w-full" value={department} onChange={handleDepartmentChange} required>
                        <option value="">Seleccione un departamento</option>
                        {departmentOptions.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Departamento:
                      <br />
                      <input className="w-full" value={department} onChange={handleDepartmentChange} required />
                    </label>
                  )}
                  <br />
                  {showDepartmentDropdown ? (
                    <label>
                      Municipio:
                      <br />
                      <select className="w-full" value={municipality} onChange={handleMunicipalityChange} required>
                        <option value="">Seleccione un municipio</option>
                        {municipalityOptions.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Municipio:
                      <br />
                      <input className="w-full" value={municipality} onChange={handleMunicipalityChange} required />
                    </label>
                  )}
                </div>
              </div>
              <button
                className="mr-1 rounded-sm border-0 bg-red-light pb-1 pl-2 pr-2 pt-1 hover:bg-redwood-light"
                onClick={() => {
                  setLocation(null)
                }}
              >
                Quitar marcador
              </button>
              <button className="rounded-sm border-0 bg-green-light pb-1 pl-2 pr-2 pt-1 hover:bg-green" onClick={submit}>
                Crear
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default InfoPanelControl

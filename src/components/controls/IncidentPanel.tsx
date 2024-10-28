import { DB, Incident } from 'types'
import { useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import AutocompleteSearch from 'components/AutocompleteSearch'
import { LatLngBoundsExpression, LatLngTuple } from 'leaflet'

interface InfoPanelControlProps {
  data: DB
  incidentID: keyof DB['Incidents'] | null
  onClose: () => void
  submitIncident: (
    dateString: Incident['dateString'],
    typeID: Incident['typeID'],
    country: Incident['country'],
    description: Incident['description'],
    department: Incident['department'],
    municipality: Incident['municipality'],
    incidentID: keyof DB['Incidents'] | null
  ) => Promise<boolean>
  location: Incident['location'] | null
  setLocation: React.Dispatch<React.SetStateAction<Incident['location'] | null>>
  tmpSelected: boolean
  setTmpSelected: React.Dispatch<React.SetStateAction<boolean>>
  isAdmin: boolean
  deleteSelectedIncident: () => void
  editID: keyof DB['Incidents'] | null
  setEditID: React.Dispatch<React.SetStateAction<keyof DB['Incidents'] | null>>
}

const InfoPanelControl: React.FC<InfoPanelControlProps> = ({
  data,
  incidentID,
  onClose,
  submitIncident,
  location,
  setLocation,
  tmpSelected,
  isAdmin,
  deleteSelectedIncident,
  editID,
  setEditID,
}) => {
  const map = useMap()
  const [description, setDescription] = useState<Incident['description']>('')
  const [country, setCountry] = useState<Incident['country']>('')
  const [countryBounds, setCountryBounds] = useState<number[] | undefined>(undefined)
  const [countryCode, setCountryCode] = useState<string>('')
  const [municipality, setMunicipality] = useState<Incident['municipality']>('')
  const [municipalityBounds, setMunicipalityBounds] = useState<number[] | undefined>(undefined)
  const [department, setDepartment] = useState<Incident['department']>('')
  const [departmentBounds, setDepartmentBounds] = useState<number[] | undefined>(undefined)
  const [dateString, setDateString] = useState<Incident['dateString']>('')
  const [typeID, setTypeID] = useState<keyof DB['Types']>('')
  const [catID, setCatID] = useState<keyof DB['Categories']>('')

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
    cancelEdit()
    onClose()
  }

  const cancelEdit = () => {
    setDescription('')
    setDateString('')
    setTypeID('')
    setCatID('')
    setCountry('')
    setDepartment('')
    setMunicipality('')
    setEditID(null)
    setLocation(null)
  }

  const submit = async () => {
    if (await submitIncident(dateString, typeID, description, country, department, municipality, editID)) {
      setDescription('')
      setDateString('')
      setTypeID('')
      setCatID('')
      setCountry('')
      setDepartment('')
      setMunicipality('')
      setLocation(null)
      close()
    }
  }

  const incident = incidentID ? data.Incidents[incidentID] : null

  useEffect(() => {
    if (editID != null) {
      if (incident) {
        setDescription(incident.description)
        setDateString(incident.dateString)
        setTypeID(incident.typeID)
        setCatID(data.Types[incident.typeID].categoryID)
        setCountry(incident.country)
        setLocation(incident.location)
        setCountry(incident.country)
        setDepartment(incident.department)
        setMunicipality(incident.municipality)
      } else {
        setDescription('')
        setDateString('')
        setTypeID('')
        setCatID('')
        setCountry('')
        setDepartment('')
        setMunicipality('')
        setLocation(null)
      }
    }
  }, [editID])

  return (
    <div
      key={'overlay'}
      className={`${
        incident || tmpSelected ? 'w-[100%] md:w-[400px]' : 'w-0'
      } duration-400 fixed left-0 z-[1000] box-border h-screen cursor-default overflow-y-scroll rounded-e-xl bg-tint-02/60 font-merriweather text-sm text-shade-02 shadow-lg backdrop-blur-sm transition-all duration-100`}
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

          {incident && editID == null && (
            <div className="px-6 py-10">
              <div className="mb-4">
                <span className="font-bold">País:</span> {incident.country}
                <br />
                {incident.department && (
                  <>
                    <span className="font-bold">Departamento:</span> {incident.department}
                    <br />
                  </>
                )}
                {incident.municipality && (
                  <>
                    <span className="font-bold">Municipio:</span> {incident.municipality}
                    <br />
                  </>
                )}
                <br />
                {incident.dateString && (
                  <>
                    <span className="font-bold">Fecha:</span> {new Date(incident.dateString).toLocaleDateString('es-ES', { timeZone: 'UTC' })} <br />
                  </>
                )}
                <span className="font-bold">Actividad:</span> {data.Categories[data.Types[incident.typeID].categoryID].name}
                <br />
                <span className="font-bold">Tipo de evento:</span> {data.Types[incident.typeID].name}
              </div>
              <span className="font-bold">Descripción:</span>
              <div className="mb-6 break-words text-shade-01">{incident.description}</div>
              <div className="mb-6 text-shade-01"></div>
              {isAdmin && (
                <>
                  <button className="mr-1 rounded-sm border-0 bg-red-light pb-1 pl-2 pr-2 pt-1 hover:bg-red" onClick={deleteSelectedIncident}>
                    Borrar
                  </button>
                  <button className="rounded-sm border-0 bg-blue-100 pb-1 pl-2 pr-2 pt-1 hover:bg-blue-200" onClick={() => setEditID(incidentID)}>
                    Editar
                  </button>
                </>
              )}
            </div>
          )}
          {(tmpSelected || editID != null) && (
            <div className="px-6 py-10">
              <h2 className="mb-4 text-xl font-bold">{editID != null ? 'Editar' : 'Crear'} Incidente</h2>
              <div className="mb-4">
                <label>
                  País:
                  <br />
                  <AutocompleteSearch
                    layers={['country']}
                    setStringValue={setCountry}
                    setCountryCode={setCountryCode}
                    setBounds={setCountryBounds}
                    initialValue={editID != null ? incident?.country : undefined}
                  />
                </label>
                {country && countryBounds && (
                  <label>
                    Departamento:
                    <br />
                    <AutocompleteSearch
                      layers={['region']}
                      setStringValue={setDepartment}
                      setBounds={setDepartmentBounds}
                      countryCode={countryCode}
                      initialValue={editID != null ? incident?.department : undefined}
                    />
                  </label>
                )}
                {department && departmentBounds && (
                  <label>
                    Municipio:
                    <br />
                    <AutocompleteSearch
                      layers={['locality']}
                      setStringValue={setMunicipality}
                      setBounds={setMunicipalityBounds}
                      department={{ name: department, bbox: departmentBounds }}
                      initialValue={editID != null ? incident?.municipality : undefined}
                    />
                  </label>
                )}
                {municipalityBounds && (
                  <button
                    className="mr-1 rounded-sm border-0 bg-blue-200 pb-1 pl-2 pr-2 pt-1 hover:bg-blue-300"
                    onClick={() => {
                      const bounds: LatLngBoundsExpression = [
                        municipalityBounds?.slice(0, 2).reverse() as LatLngTuple,
                        municipalityBounds?.slice(2).reverse() as LatLngTuple,
                      ]
                      map.flyToBounds(bounds, { maxZoom: 10 })
                    }}
                  >
                    Zoom sobre el Municipio
                  </button>
                )}
                {location && (
                  <button
                    className="m-2 mr-1 block rounded-sm border-0 bg-red-100 pb-1 pl-2 pr-2 pt-1 hover:bg-red-200"
                    onClick={() => {
                      setLocation(null)
                    }}
                  >
                    Quitar marcador
                  </button>
                )}
                <br />
                <br />
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
                  Descripción:
                  <br />
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={10} cols={40} />
                </label>
                <br />
              </div>
              <button className="rounded-sm border-0 bg-green-100 pb-1 pl-2 pr-2 pt-1 hover:bg-green-200" onClick={submit}>
                {editID != null ? 'Aplicar' : 'Crear'}
              </button>
              {editID != null && (
                <button className="rounded-sm border-0 bg-red-100 pb-1 pl-2 pr-2 pt-1 hover:bg-red-200" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default InfoPanelControl

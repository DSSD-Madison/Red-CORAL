import { Incident } from 'types'
import { useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import AutocompleteSearch from 'components/AutocompleteSearch'
import { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import { formatDateString, typeIDtoCategory, typeIDtoTypeName } from '@/utils'
import { useDB } from '@/context/DBContext'
import ActivityTypeSelector from './ActivityTypeSelector'
import { LucidePlus, LucideTrash, LucideZoomIn } from 'lucide-react'

interface InfoPanelControlProps {
  incidentID: string | null
  onClose: () => void
  submitIncident: (
    dateString: Incident['dateString'],
    types: Incident['typeID'],
    description: Incident['description'],
    country: Incident['country'],
    department: Incident['department'],
    municipality: Incident['municipality'],
    incidentID: string | null
  ) => Promise<boolean>
  location: Incident['location'] | null
  setLocation: React.Dispatch<React.SetStateAction<Incident['location'] | null>>
  tmpSelected: boolean
  setTmpSelected: React.Dispatch<React.SetStateAction<boolean>>
  isAdmin: boolean
  deleteSelectedIncident: () => void
  editID: string | null
  setEditID: React.Dispatch<React.SetStateAction<string | null>>
}

type ActivityTypePair = [string, string] // [keyof DB['Types'], keyof DB['Categories']]

const InfoPanelControl: React.FC<InfoPanelControlProps> = ({
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
  const { db } = useDB()
  const [description, setDescription] = useState<Incident['description']>('')
  const [country, setCountry] = useState<Incident['country']>('')
  const [countryCode, setCountryCode] = useState<string>('')
  const [municipality, setMunicipality] = useState<Incident['municipality']>('')
  const [municipalityBounds, setMunicipalityBounds] = useState<number[] | undefined>(undefined)
  const [department, setDepartment] = useState<Incident['department']>('')
  const [departmentBounds, setDepartmentBounds] = useState<number[] | undefined>(undefined)
  const [dateString, setDateString] = useState<Incident['dateString']>('')
  const [types, setTypes] = useState<(ActivityTypePair | [])[]>([[]])

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
    setTypes([[]])
    setCountry('')
    setDepartment('')
    setMunicipality('')
    setEditID(null)
    setLocation(null)
  }

  const submit = async () => {
    const filteredTypes = types.filter((type) => type.length > 0) as ActivityTypePair[]
    if (filteredTypes.length === 0) {
      alert('Por favor, selecciona al menos un tipo de evento')
      return
    }
    const typeIDs = filteredTypes.map((pair) => pair[0])
    if (await submitIncident(dateString, typeIDs, description, country, department, municipality, editID)) {
      setDescription('')
      setDateString('')
      setTypes([[]])
      setCountry('')
      setDepartment('')
      setMunicipality('')
      setLocation(null)
      close()
    }
  }

  const incident = incidentID ? db.Incidents[incidentID] : null
  const existingTypesToPairs = (typeID: Incident['typeID']): [string, string][] => {
    if (Array.isArray(typeID)) {
      return typeID.map((id) => [id, db.Types[id].categoryID as string])
    }
    return [[typeID, db.Types[typeID].categoryID as string]]
  }
  const typeColors = Object.fromEntries(Object.entries(db.Types || {}).map(([id, type]) => [id, db.Categories[type.categoryID].color]))
  const typeIDtoTypeColors = (typeID: string | string[]) => {
    return typeColors[Array.isArray(typeID) ? typeID[0] : typeID]
  }

  useEffect(() => {
    if (editID != null) {
      if (incident) {
        setDescription(incident.description)
        setDateString(incident.dateString)
        setTypes(existingTypesToPairs(incident.typeID))
        setCountry(incident.country)
        setLocation(incident.location)
        setCountry(incident.country)
        setDepartment(incident.department)
        setMunicipality(incident.municipality)
      } else {
        cancelEdit()
      }
    }
  }, [editID])

  // Handlers for ActivityTypeSelector component
  const handleCategoryChange = (index: number, categoryID: string) => {
    setTypes((prevPairs) => prevPairs.map((pair, i) => (i === index ? ['', categoryID] : pair)))
  }

  const handleTypeChange = (index: number, typeID: string) => {
    setTypes((prevPairs) => prevPairs.map((pair, i) => (i === index && pair.length == 2 ? [typeID, pair[1]] : pair)))
  }

  const handleAddPair = () => {
    setTypes((prevPairs) => [...prevPairs, ['', '']])
  }

  const handleRemovePair = (index: number) => {
    setTypes((prevPairs) => prevPairs.filter((_, i) => i !== index))
  }
  return (
    <div
      key={'overlay'}
      className={`${
        incident || tmpSelected ? 'w-[100%] md:w-[400px]' : 'w-0'
      } duration-400 absolute bottom-0 left-0 top-0 z-[1000] box-border cursor-default overflow-y-auto rounded-r-xl bg-tint-02/60 font-merriweather text-sm text-shade-02 shadow-lg backdrop-blur-sm transition-all duration-100`}
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
            <div className="py-10 pl-6 pr-2">
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
                    <span className="font-bold">Fecha:</span> {formatDateString(incident.dateString)} <br />
                  </>
                )}
                <span className="font-bold">Actividad{Array.isArray(incident.typeID) && incident.typeID.length > 1 ? 'es' : ''}:</span>
                <ul className="mt-1">
                  {Array.isArray(incident.typeID) ? (
                    incident.typeID.map((typeID) => (
                      <li key={typeID} className="mb-3 ml-2 text-shade-01">
                        <span style={{ backgroundColor: typeIDtoTypeColors(typeID) }} className="mr-1 rounded-md p-1 text-xs">
                          {/* https://css-tricks.com/methods-contrasting-text-backgrounds/ */}
                          <span className="bg-inherit bg-clip-text text-transparent contrast-[900] grayscale invert">
                            {typeIDtoCategory(db, typeID).name}
                          </span>
                        </span>
                        {typeIDtoTypeName(db, typeID)}
                      </li>
                    ))
                  ) : (
                    <li className="mb-3 ml-2 text-xs text-shade-01">
                      <span style={{ backgroundColor: typeIDtoTypeColors(incident.typeID) }} className="mr-1 rounded-md p-1 text-xs">
                        <span className="bg-inherit bg-clip-text text-transparent contrast-[900] grayscale invert">
                          {typeIDtoCategory(db, incident.typeID).name}
                        </span>
                      </span>
                      {typeIDtoTypeName(db, incident.typeID)}
                    </li>
                  )}
                </ul>
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
                    setBounds={() => {}} // Country bounds are not used
                    initialValue={editID != null ? incident?.country : undefined}
                  />
                </label>
                {country && countryCode != 'world' && (
                  <label>
                    Departamento:
                    <br />
                    <AutocompleteSearch
                      layers={['region']}
                      setStringValue={setDepartment}
                      setBounds={setDepartmentBounds}
                      countryCode={countryCode}
                      countryName={country}
                      initialValue={editID != null ? incident?.department : undefined}
                    />
                  </label>
                )}
                {department && (
                  <label>
                    Municipio:
                    <br />
                    <AutocompleteSearch
                      layers={['locality']}
                      setStringValue={setMunicipality}
                      setBounds={setMunicipalityBounds}
                      department={{ name: department, bbox: departmentBounds }}
                      countryName={country}
                      initialValue={editID != null ? incident?.municipality : undefined}
                    />
                  </label>
                )}
                <div className="mb-2 mt-2 flex items-center gap-2">
                  {municipalityBounds && (
                    <button
                      className="rounded-sm border-0 bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-300"
                      onClick={() => {
                        const bounds: LatLngBoundsExpression = [
                          municipalityBounds?.slice(0, 2).reverse() as LatLngTuple,
                          municipalityBounds?.slice(2).reverse() as LatLngTuple,
                        ]
                        map.flyToBounds(bounds, { maxZoom: 10 })
                      }}
                    >
                      <LucideZoomIn className="mr-1 inline h-4 w-4" />
                      Zoom sobre el Municipio
                    </button>
                  )}
                  {location && (
                    <button
                      className="rounded-sm border-0 bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200"
                      onClick={() => {
                        setLocation(null)
                      }}
                    >
                      <LucideTrash className="mr-1 inline h-4 w-4" />
                      Quitar marcador
                    </button>
                  )}
                </div>
                <hr className="my-4 border-neutral-400" />
                Fecha:
                <br />
                <input
                  type="date"
                  className="mb-2 w-full rounded-md p-2"
                  value={dateString}
                  onChange={(e) => setDateString(e.target.value)}
                  required
                />
                <hr className="my-4 border-neutral-400" />
                <div className="mb-2">
                  <h3 className="mb-1">Actividades y Tipos de Evento:</h3>
                  {types.map(([typeID, catID], index) => (
                    <ActivityTypeSelector
                      key={index} // Using index as key is okay here if list order doesn't change drastically except adds/removes
                      index={index}
                      categoryID={catID}
                      typeID={typeID}
                      onChangeCategory={handleCategoryChange}
                      onChangeType={handleTypeChange}
                      onRemove={handleRemovePair}
                      canRemove={types.length > 1} // Can remove if more than one exists
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPair}
                    className="rounded-sm border-0 bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
                  >
                    <LucidePlus className="mr-1 inline h-4 w-4" />
                    Añadir actividad
                  </button>
                </div>
                <hr className="my-4 border-neutral-400" />
                <label>
                  Descripción:
                  <br />
                  <textarea
                    className="w-full rounded-md px-3 py-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={10}
                  />
                </label>
                <br />
              </div>
              <div className="flex justify-center">
                <button className="rounded-md border-0 bg-green-100 p-2 hover:bg-green-200" onClick={submit}>
                  {editID != null ? 'Aplicar' : 'Crear'}
                </button>
                {editID != null && (
                  <button className="rounded-sm border-0 bg-red-100 pb-1 pl-2 pr-2 pt-1 hover:bg-red-200" onClick={cancelEdit}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default InfoPanelControl

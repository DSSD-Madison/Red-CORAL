import React, { useState, useEffect } from 'react'
import { collection, getDocs, where, query, doc } from 'firebase/firestore/lite'
import { addDocWithTimestamp, setDocWithTimestamp, deleteDocWithTimestamp } from '@/utils'
import LoadingOverlay from '@/components/LoadingOverlay'
import { SketchPicker } from 'react-color'
import { Category, Type } from '@/types'
import { useDB } from '../context/DBContext'

const AdminCRUD: React.FC = () => {
  const { firestore, db: data } = useDB()
  const [isLoading, setIsLoading] = useState(false)
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [addEntityName, setAddEntityName] = useState('')
  const [addEntitySecondProperty, setAddEntitySecondProperty] = useState('')
  const [modifyEntityId, setModifyEntityId] = useState<string | null>(null)
  const [modifyEntityName, setModifyEntityName] = useState('')
  const [modifyEntitySecondProperty, setModifyEntitySecondProperty] = useState('')
  const [entityType, setEntityType] = useState<'Categories' | 'Types'>('Categories')

  const handleAddEntityNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddEntityName(event.target.value)
  }

  const handleAddEntityColorChange = (color: any) => {
    setAddEntitySecondProperty(color.hex) // Actualiza el valor del color
  }

  const handleModifyEntityColorChange = (color: any) => {
    setModifyEntitySecondProperty(color.hex)
  }

  // 🚨 Below handlers mutate the data object 🚨
  // They cause this component to rerender, but not any parent component (and thus not any cousins such as Map)

  const handleAddEntity = async () => {
    try {
      if (addEntityName.trim() === '') {
        window.alert('El nombre no puede estar vacío')
        return
      }
      if (entityType === 'Categories' && addEntitySecondProperty.trim() === '') {
        window.alert('Por favor seleccione un color')
        return
      } else if (entityType === 'Types' && !data.Categories[addEntitySecondProperty]) {
        window.alert('Por favor seleccione una actividad')
        return
      }
      const docData: any = {
        name: addEntityName,
      }
      if (entityType == 'Categories') {
        docData['color'] = addEntitySecondProperty
      } else {
        docData['categoryID'] = addEntitySecondProperty
      }
      setIsLoading(true)
      const ref = await addDocWithTimestamp(collection(firestore, entityType), docData)
      data[entityType][ref.id] = docData
      setIsLoading(false)

      // Clear the input fields and hide them
      setAddEntityName('')
      setAddEntitySecondProperty('')
      setShowAddEntity(false)

      setIsLoading(false)
    } catch (error) {
      window.alert('Error al agregar')
      setIsLoading(false)
    }
  }

  const handleDeleteEntity = async (entityId: string) => {
    try {
      if (entityType === 'Types') {
        let col = collection(firestore, 'Incidents')
        const q = query(col, where('typeID', '==', entityId))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          window.alert('No se puede eliminar una actividad que tiene eventos asociados')
          return
        }
      } else {
        let col = collection(firestore, 'Types')
        const q = query(col, where('categoryID', '==', entityId))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          window.alert('No se puede eliminar una actividad que tiene tipos de eventos asociados')
          return
        }
      }
      // Show confirmation dialog before deleting
      const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar ${data[entityType][entityId].name}?`)

      if (confirmed) {
        // if confirmed, delete
        setIsLoading(true)
        let ref = doc(firestore, `${entityType}/${entityId}`)
        await deleteDocWithTimestamp(ref)
        delete data[entityType][entityId]
        setIsLoading(false)
      }
    } catch (error) {
      window.alert('Error al eliminar ' + entityType.toLowerCase())
      setIsLoading(false)
    }
  }

  const handleModifyEntity = async () => {
    if (modifyEntityName.trim() === '') {
      window.alert('El nombre no puede estar vacío')
      return
    }
    if (entityType === 'Categories' && modifyEntitySecondProperty.trim() === '') {
      window.alert('Por favor seleccione un color')
      return
    } else if (entityType === 'Types' && !data.Categories[modifyEntitySecondProperty]) {
      window.alert('Por favor seleccione una actividad')
      return
    }
    try {
      let docData: Category | Type = {
        name: modifyEntityName,
        color: modifyEntitySecondProperty,
      }
      if (entityType === 'Types') {
        docData = {
          name: modifyEntityName,
          categoryID: modifyEntitySecondProperty,
        }
      }
      let ref = doc(firestore, `${entityType}/${modifyEntityId}`)
      setIsLoading(true)
      await setDocWithTimestamp(ref, docData as any)
      data[entityType][ref.id] = docData
      setIsLoading(false)

      // clear and hide input fields
      setModifyEntityName('')
      setModifyEntitySecondProperty('')
      setModifyEntityId(null)

      // call showEntities to fetch and display updated data[entityType]
    } catch (error) {
      window.alert('Error al modificar ' + entityType.toLowerCase())
      setIsLoading(false)
    }
  }

  const toggleEntityType = async (type: 'Categories' | 'Types') => {
    setEntityType(type)
    setShowAddEntity(false)
    setModifyEntityId(null)
  }

  useEffect(() => {
    setModifyEntityName(data[entityType][modifyEntityId || '']?.name || '')
    if (entityType == 'Types') {
      setModifyEntitySecondProperty((data[entityType][modifyEntityId || '']?.categoryID || '') as string)
    } else {
      setModifyEntitySecondProperty(data[entityType][modifyEntityId || '']?.color || '')
    }
  }, [modifyEntityId])

  const entityTypesSpanish = {
    Categories: 'Actividades',
    Types: 'Tipos de Eventos',
  }

  return (
    <div className="relative flex h-full flex-col gap-2 px-4 py-2">
      {/* Title displaying current entity type */}
      <h2 className="text-2xl font-semibold">{entityTypesSpanish[entityType]}</h2>
      <div>
        {entityType == 'Types' && (
          <button onClick={() => toggleEntityType('Categories')} className="mr-2 rounded-full bg-shade-01 px-4 py-2 text-white shadow-md">
            Cambiar a Actividad
          </button>
        )}
        {entityType == 'Categories' && (
          <button onClick={() => toggleEntityType('Types')} className="mr-2 rounded-full bg-shade-01 px-4 py-2 text-white shadow-md">
            Cambiar a Tipo de Evento
          </button>
        )}
      </div>
      {/* Two column layout for forms */}
      <div className="min-h-0 flex-1 grid-cols-[1fr,1fr] gap-4 overflow-auto md:grid md:overflow-hidden">
        {/* Scrollable list view */}
        <div className="max-w-4xl overflow-auto" style={{ scrollbarGutter: 'stable' }}>
          {Object.entries(data[entityType])
            .sort((a, b) => {
              const entity1 = a[1]
              const entity2 = b[1]
              try {
                let catName1: string
                let catName2: string
                if (entityType == 'Categories') {
                  catName1 = (entity1 as Category).name
                  catName2 = (entity2 as Category).name
                } else {
                  catName1 = data.Categories[(entity1 as Type).categoryID].name
                  catName2 = data.Categories[(entity2 as Type).categoryID].name
                }
                return catName1.localeCompare(catName2)
              } catch (e) {
                return 0
              }
            })
            .map(([id, entity], index, array) => (
              <React.Fragment key={id}>
                {entityType !== 'Categories' && (index == 0 || (entity as Type).categoryID != array[index - 1][1].categoryID) && (
                  <div className="mb-1 mt-1 font-bold">{data.Categories[(entity as Type).categoryID]?.name}</div>
                )}
                <div key={id} className="flex items-center justify-between border-b p-2">
                  {entityType === 'Categories' && <div className="h-6 w-6 rounded-full" style={{ backgroundColor: entity.color }}></div>}
                  <p>{entity.name}</p>
                  <div className="flex">
                    <button
                      onClick={() => {
                        setModifyEntityId(id)
                        setShowAddEntity(false)
                      }}
                      className="ml-4 rounded-full bg-red px-4 py-2 text-white shadow-md"
                    >
                      Editar
                    </button>
                    <button onClick={() => handleDeleteEntity(id)} className="ml-4 rounded-full bg-red px-4 py-2 text-white shadow-md">
                      Eliminar
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
        </div>
        {showAddEntity && (
          <div className="col-start-2 max-h-full overflow-auto">
            <input
              type="text"
              className="mb-2 mr-2 rounded-md border border-gray-300 px-3 py-2"
              placeholder={`nombre`}
              value={addEntityName}
              onChange={handleAddEntityNameChange}
            />
            {entityType === 'Categories' && <SketchPicker color={addEntitySecondProperty} onChange={handleAddEntityColorChange} />}
            {entityType !== 'Categories' && (
              <select value={addEntitySecondProperty} onChange={(e) => setAddEntitySecondProperty(e.target.value)}>
                <option value="">--Por favor elige una actividad--</option>
                {Object.entries(data.Categories).map(([id, cat]) => (
                  <option key={id} value={id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <button onClick={handleAddEntity} className="mr-2 rounded-full bg-green px-4 py-2 text-white shadow-md">
              Enviar
            </button>
            <button onClick={() => setShowAddEntity(false)} className="mr-2 rounded-full bg-red px-4 py-2 text-white shadow-md">
              Cancelar
            </button>
          </div>
        )}
        {/* Edit form */}
        {modifyEntityId && (
          <div className="col-start-2 mb-4 flex max-h-full flex-col items-center gap-2 overflow-auto">
            <input
              type="text"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder={`nuevo nombre`}
              value={modifyEntityName}
              onChange={(e) => setModifyEntityName(e.target.value)}
            />
            {entityType === 'Categories' && <SketchPicker color={modifyEntitySecondProperty} onChange={handleModifyEntityColorChange} />}
            {entityType !== 'Categories' && (
              <select
                value={modifyEntitySecondProperty}
                onChange={(e) => setModifyEntitySecondProperty(e.target.value)}
                className="rounded-md border border-gray-300 p-2 text-center"
              >
                <option value="">--Por favor elige una actividad--</option>
                {Object.entries(data.Categories).map(([id, cat]) => (
                  <option key={id} value={id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <button onClick={handleModifyEntity} className="rounded-full bg-green px-4 py-2 text-white shadow-md">
              Guardar Cambios
            </button>
            <button onClick={() => setModifyEntityId(null)} className="rounded-full bg-red px-4 py-2 text-white shadow-md">
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={() => {
            setModifyEntityId(null)
            setShowAddEntity(true)
          }}
          className="rounded-full bg-red px-4 py-2 text-white shadow-md"
        >
          Agregar
        </button>
      </div>
      <LoadingOverlay isVisible={isLoading} color={'#666666'} />
    </div>
  )
}

export default AdminCRUD

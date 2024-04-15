import React, { useState, useEffect } from 'react'
import { FirebaseApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, where, query, updateDoc, doc } from 'firebase/firestore'
import LoadingOverlay from './LoadingOverlay'
import { SketchPicker } from 'react-color'
import { Category, Type, DB } from '../types'

interface CrudProps {
  app: FirebaseApp
}

const CRUDDash: React.FC<CrudProps> = ({ app }) => {
  const firestore = getFirestore(app)

  const [isLoading, setIsLoading] = useState(false)
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [addEntityName, setAddEntityName] = useState('')
  const [addEntitySecondProperty, setAddEntitySecondProperty] = useState('')
  const [modifyEntityId, setModifyEntityId] = useState<string | null>(null)
  const [modifyEntityNewName, setModifyEntityNewName] = useState('')
  const [modifyEntitySecondProperty, setModifyEntitySecondProperty] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [entityType, setEntityType] = useState<'Categories' | 'Types'>('Categories')
  const [entities, setEntities] = useState<DB['Categories'] | DB['Types']>({})
  const [cats, setCats] = useState<DB['Categories']>({})
  const [types, setTypes] = useState<DB['Types']>({})

  const showEntities = async () => {
    setIsLoading(true)
    setEntities({})
    try {
      const q = collection(firestore, 'Categories')
      const querySnapshot = await getDocs(q)
      const cats: DB['Categories'] = {}
      querySnapshot.forEach((doc) => {
        cats[doc.id] = doc.data() as Category
      })
      setCats(cats)
      const q2 = collection(firestore, 'Types')
      const querySnapshot2 = await getDocs(q2)
      const types: DB['Types'] = {}
      querySnapshot2.forEach((doc) => {
        types[doc.id] = doc.data() as Type
      })
      setTypes(types)
      if (entityType === 'Categories') {
        setEntities(cats)
      } else setEntities(types)
    } catch (error) {
      setErrorMessage('Error al obtener ' + entityType.toLowerCase())
      window.alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntityNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddEntityName(event.target.value)
  }

  const handleAddEntityColorChange = (color: any) => {
    setAddEntitySecondProperty(color.hex) // Actualiza el valor del color
  }

  const handleModifyEntityColorChange = (color: any) => {
    setModifyEntitySecondProperty(color.hex)
  }

  const handleAddEntity = async () => {
    try {
      if (addEntityName.trim() === '' || addEntitySecondProperty.trim() === '') {
        return // No hagas nada si alguno de los campos de entrada está vacío
      }

      let secondProperty = addEntitySecondProperty

      if (entityType === 'Types') {
        // If entityType is 'Types', search for the category name in Firestore
        const categoryQuery = query(collection(firestore, 'Categories'), where('name', '==', addEntitySecondProperty))
        const categorySnapshot = await getDocs(categoryQuery)

        if (!categorySnapshot.empty) {
          // If category found, use its document ID as the category ID for 'Types'
          categorySnapshot.forEach((doc) => {
            secondProperty = doc.id
          })
        } else {
          // Handle case when category not found
          setErrorMessage('Categoría no encontrada')
          window.alert(errorMessage)
          return
        }
      }

      // Add the entity with the appropriate second property
      const docData: any = {
        name: addEntityName,
      }
      if (entityType == 'Categories') {
        docData['color'] = secondProperty
      } else {
        docData['categoryID'] = secondProperty
      }
      await addDoc(collection(firestore, entityType), docData)

      // Clear the input fields and hide them
      setAddEntityName('')
      setAddEntitySecondProperty('')
      setShowAddEntity(false)

      // Call showEntities to fetch and display the updated entities list
      await showEntities()
    } catch (error) {
      setErrorMessage('Error al agregar ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }
  }

  const handleDeleteEntity = async (entityId: string) => {
    try {
      // Show confirmation dialog before deleting
      const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar ${entities[entityId].name}?`)

      if (confirmed) {
        // if confirmed, delete
        let ref = doc(firestore, `${entityType}/${entityId}`)
        await deleteDoc(ref)
        await showEntities()
      }
    } catch (error) {
      setErrorMessage('Error al eliminar ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }
  }

  const handleModifyEntity = async () => {
    if (modifyEntityNewName.trim() === '') {
      setErrorMessage('nuevo nombre')
      window.alert(errorMessage)
      return
    }
    try {
      let ref = doc(firestore, `${entityType}/${modifyEntityId}`)
      if (entityType === 'Categories') {
        await updateDoc(ref, {
          name: modifyEntityNewName,
          color: modifyEntitySecondProperty,
        })
      } else {
        await updateDoc(ref, {
          name: modifyEntityNewName,
          categoryID: modifyEntitySecondProperty,
        })
      }

      // clear and hide input fields
      setModifyEntityNewName('')
      setModifyEntitySecondProperty('')
      setModifyEntityId(null)

      // call showEntities to fetch and display updated entities
      await showEntities()
    } catch (error) {
      setErrorMessage('Error al modificar ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }
  }

  const toggleEntityType = async (type: 'Categories' | 'Types') => {
    setEntityType(type)
    setShowAddEntity(false)
    setModifyEntityId(null)
  }

  useEffect(() => {
    showEntities()
  }, [entityType])

  useEffect(() => {
    setModifyEntityNewName(entities[modifyEntityId || '']?.name || '')
    if (entityType == 'Types') {
      setModifyEntitySecondProperty((types[modifyEntityId || '']?.categoryID || '') as string)
    } else {
      setModifyEntitySecondProperty(cats[modifyEntityId || '']?.color || '')
    }
  }, [modifyEntityId])

  const entityTypesSpanish = {
    Categories: 'Actividades',
    Types: 'Tipos de Eventos',
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center">
      <div className="absolute right-0 top-0 m-4">
        <button className="mb-4 mr-2 rounded-full bg-shade-01 px-4 py-2 text-white shadow-md" onClick={() => (window.location.href = '/admin')}>
          Volver al mapa
        </button>
      </div>
      <div className="absolute left-0 top-0 m-4">
        {entityType == 'Types' && (
          <button onClick={() => toggleEntityType('Categories')} className="mb-4 mr-2 rounded-full bg-shade-01 px-4 py-2 text-white shadow-md">
            Cambiar a Actividad
          </button>
        )}
        {entityType == 'Categories' && (
          <button onClick={() => toggleEntityType('Types')} className="mb-4 mr-2 rounded-full bg-shade-01 px-4 py-2 text-white shadow-md">
            Cambiar a Tipo de Evento
          </button>
        )}
      </div>
      {/* Title displaying current entity type */}
      <h2 className="mb-4 text-2xl font-bold">{entityTypesSpanish[entityType]}</h2>
      {/* Edit form */}
      {modifyEntityId && (
        <div className="mb-4 flex flex-col items-center">
          <input
            type="text"
            className="border-gray-300 mb-2 mr-2 rounded-md border px-3 py-2"
            placeholder={`nuevo nombre`}
            value={modifyEntityNewName}
            onChange={(e) => setModifyEntityNewName(e.target.value)}
          />
          {entityType === 'Categories' && <SketchPicker color={modifyEntitySecondProperty} onChange={handleModifyEntityColorChange} />}
          {entityType !== 'Categories' && (
            <select
              value={modifyEntitySecondProperty}
              onChange={(e) => setModifyEntitySecondProperty(e.target.value)}
              className="border-gray-300 mb-2 mr-2 rounded-md border p-2 text-center"
            >
              <option value="">--Por favor elige una actividad--</option>
              {Object.entries(cats).map(([id, cat], index) => (
                <option key={index} value={id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleModifyEntity} className="mr-2 rounded-full bg-green px-4 py-2 text-white shadow-md">
            Guardar Cambios
          </button>
          <button onClick={() => setModifyEntityId(null)} className="mr-2 rounded-full bg-red px-4 py-2 text-white shadow-md">
            Cancelar
          </button>
        </div>
      )}
      {/* Scrollable list view */}
      <div className="ove6rflow-x-auto mb-6 h-80 w-full max-w-4xl overflow-y-scroll">
        {Object.entries(entities)
          .sort(([id1, entity1], [id2, entity2]) => {
            try {
              let catName1: string
              let catName2: string
              if (entityType == 'Categories') {
                catName1 = (entity1 as Category).name
                catName2 = (entity2 as Category).name
              } else {
                catName1 = cats[(entity1 as Type).categoryID].name
                catName2 = cats[(entity2 as Type).categoryID].name
              }
              return catName1.localeCompare(catName2)
            } catch (e) {
              return 0
            }
          })
          .map(([id, entity], index, array) => (
            <>
              {entityType !== 'Categories' && (index == 0 || (entity as Type).categoryID != array[index - 1][1].categoryID) && (
                <div className="mb-1 mt-1 font-bold">{cats[(entity as Type).categoryID]?.name}</div>
              )}
              <div key={index} className="flex items-center justify-between border-b p-2">
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
            </>
          ))}
      </div>

      <div className="mb-4 flex flex-col items-center">
        <button
          onClick={() => {
            setModifyEntityId(null)
            setShowAddEntity(true)
          }}
          className="mb-4 rounded-full bg-red px-4 py-2 text-white shadow-md"
        >
          Agregar
        </button>
        {showAddEntity && (
          <div>
            <input
              type="text"
              className="border-gray-300 mb-2 mr-2 rounded-md border px-3 py-2"
              placeholder={`nombre`}
              value={addEntityName}
              onChange={handleAddEntityNameChange}
            />
            {entityType === 'Categories' && <SketchPicker color={addEntitySecondProperty} onChange={handleAddEntityColorChange} />}
            {entityType !== 'Categories' && (
              <select value={addEntitySecondProperty} onChange={(e) => setAddEntitySecondProperty(e.target.value)}>
                <option value="">--Por favor elige una actividad--</option>
                {Object.entries(cats).map(([id, cat], index) => (
                  <option key={index} value={id}>
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
      </div>
      {isLoading && <LoadingOverlay isVisible={isLoading} color={'#666666'} />}
    </div>
  )
}

export default CRUDDash

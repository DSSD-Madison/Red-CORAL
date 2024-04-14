import React, { useState, useEffect } from 'react'
import { FirebaseApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, where, query, updateDoc } from 'firebase/firestore'
import LoadingOverlay from './LoadingOverlay'
import { SketchPicker } from 'react-color'

interface CrudProps {
  app: FirebaseApp
}

const CRUDDash: React.FC<CrudProps> = ({ app }) => {
  const firestore = getFirestore(app)

  const [entities, setEntities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [addEntityName, setAddEntityName] = useState('')
  const [addEntitySecondProperty, setAddEntitySecondProperty] = useState('')
  const [showModifyEntity, setShowModifyEntity] = useState(false)
  const [modifyEntityOldName, setModifyEntityOldName] = useState('')
  const [modifyEntityNewName, setModifyEntityNewName] = useState('')
  const [modifyEntitySecondProperty, setModifyEntitySecondProperty] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [entityType, setEntityType] = useState<'Categories' | 'Types'>('Categories')

  const showEntities = async () => {
    setIsLoading(true)
    try {
      const q = collection(firestore, entityType)
      const querySnapshot = await getDocs(q)
      const entitiesArray: string[] = []
      querySnapshot.forEach((doc) => {
        const entity = doc.data()
        entitiesArray.push(entity.name)
      })
      setEntities(entitiesArray)
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
      await addDoc(collection(firestore, entityType), {
        name: addEntityName,
        categoryID: secondProperty,
      })

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



  const handleDeleteEntity = async (entityToDelete: string) => {
    try {
      // Show confirmation dialog before deleting
      const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar ${entityToDelete}?`)

      if (confirmed) {
        // if confirmed, delete
        const q = query(collection(firestore, entityType), where('name', '==', entityToDelete))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref)
          })
          await showEntities()
        } else {
          setErrorMessage(entityType + ' no encontrado')
          window.alert(errorMessage)
        }
      }
    } catch (error) {
      setErrorMessage('Error al eliminar ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }

  }

  const handleModifyEntity = async () => {
    if (modifyEntityNewName.trim() === '') {
      setErrorMessage('Por favor, ingresa un nuevo nombre')
      window.alert(errorMessage)
      return
    }
    try {
      const q = query(collection(firestore, entityType), where('name', '==', modifyEntityOldName))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          if (entityType === 'Categories') {
            await updateDoc(doc.ref, {
              name: modifyEntityNewName,
              color: modifyEntitySecondProperty,
            })
          } else {
            await updateDoc(doc.ref, {
              name: modifyEntityNewName,
              categoryID: modifyEntitySecondProperty,
            })
          }
        })
      } else {
        setErrorMessage(entityType + ' no encontrado')
        window.alert(errorMessage)
      }

      // clear and hide input fields
      setModifyEntityNewName('')
      setModifyEntitySecondProperty('')
      setModifyEntityOldName('')
      setShowModifyEntity(false)

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
    setShowModifyEntity(false)
  }

  useEffect(() => {
    showEntities() 
  }, [entityType])

  const entityTypesSpanish = {
    Categories: 'Actividades',
    Types: 'Tipos de Eventos',
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <div className="absolute top-0 left-0 m-4">
        <button onClick={() => toggleEntityType('Categories')} className="px-4 py-2 mb-4 mr-2 text-white rounded-full shadow-md bg-green">
          Cambiar a Actividad
        </button>
        <button onClick={() => toggleEntityType('Types')} className="px-4 py-2 mb-4 mr-2 text-white rounded-full shadow-md bg-green">
          Cambiar a Tipo de Evento
        </button>
      </div>
      {/* Title displaying current entity type */}
      <h2 className="mb-4 text-2xl font-bold">{entityTypesSpanish[entityType]}</h2>
      {/* Edit form */}
      {showModifyEntity && (
        <div className="flex flex-col items-center mb-4">
          <input
            type="text"
            className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
            placeholder={`Ingresa el nuevo nombre`}
            value={modifyEntityNewName}
            onChange={(e) => setModifyEntityNewName(e.target.value)}
          />
          {entityType === 'Categories' && <SketchPicker color={modifyEntitySecondProperty} onChange={handleModifyEntityColorChange} />}
          {entityType !== 'Categories' && (
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder="Ingresa el nuevo ID de actividad"
              value={modifyEntitySecondProperty}
              onChange={(e) => setModifyEntitySecondProperty(e.target.value)}
            />
          )}
          <button onClick={handleModifyEntity} className="px-4 py-2 mr-2 text-white rounded-full shadow-md bg-green">
            Guardar Cambios
          </button>
        </div>
      )}
      {/* Scrollable list view */}
      <div className="w-full max-w-4xl mb-6 overflow-y-scroll ove6rflow-x-auto h-80">
        {entities.map((entity, index) => (
          <div key={index} className="flex items-center justify-between p-2 border-b">
            <p>{entity}</p>
            <div className="flex">
              <button
                onClick={() => {
                  setModifyEntityOldName(entity)
                  setShowModifyEntity(true)
                  setShowAddEntity(false)
                }}
                className="px-4 py-2 ml-4 text-white rounded-full shadow-md bg-red"
              >
                Editar
              </button>
              <button onClick={() => handleDeleteEntity(entity)} className="px-4 py-2 ml-4 text-white rounded-full shadow-md bg-red">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
  
      <div className="flex flex-col items-center mb-4">
        <button
          onClick={() => {
            setShowModifyEntity(false)
            setShowAddEntity(true)
          }}
          className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red"
        >
          Agregar
        </button>
        {showAddEntity && (
          <div>
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={`Ingresa el nombre de ${entityType.toLowerCase()}`}
              value={addEntityName}
              onChange={handleAddEntityNameChange}
            />
            {entityType === 'Categories' && <SketchPicker color={addEntitySecondProperty} onChange={handleAddEntityColorChange} />}
            {entityType !== 'Categories' && (
              <input
                type="text"
                className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
                placeholder="Ingresa el nombre de categoría"
                value={addEntitySecondProperty}
                onChange={(e) => setAddEntitySecondProperty(e.target.value)}
              />
            )}
            <button onClick={handleAddEntity} className="px-4 py-2 mr-2 text-white rounded-full shadow-md bg-green">
              Enviar
            </button>
          </div>
        )}
      </div>
      {isLoading && <LoadingOverlay isVisible={isLoading} />}
    </div>
  )
}

export default CRUDDash

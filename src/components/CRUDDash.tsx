import React, { useState } from 'react'
import { FirebaseApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, where, query } from 'firebase/firestore'
import LoadingOverlay from './LoadingOverlay'

interface CrudProps {
  app: FirebaseApp
  isAdmin: boolean
}

const CRUDDash: React.FC<CrudProps> = ({ app }) => {
  const firestore = getFirestore(app)

  const [entities, setEntities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityColor, setNewEntityColor] = useState('')
  const [isEntitiesShown, setIsEntitiesShown] = useState(false)
  const [deleteEntityName, setDeleteEntityName] = useState('')
  const [showDeleteEntity, setShowDeleteEntity] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [entityType, setEntityType] = useState<'Categories' | 'Type'>('Categories') // Initialize with Category

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
      setErrorMessage('Error fetching ' + entityType.toLowerCase())
      window.alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEntityNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewEntityName(event.target.value)
  }

  const handleEntityColorInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewEntityColor(event.target.value)
  }

  const handleEntityColorFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.placeholder = ''
  }

  const handleEntityColorBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.placeholder = '#000000'
  }

  const handleAddEntity = async () => {
    if (newEntityName.trim() === '' || newEntityColor.trim() === '') {
      // Do nothing if either input field is empty
      return
    }

    try {
      await addDoc(collection(firestore, entityType), {
        name: newEntityName,
        color: newEntityColor,
      })

      // Clear the input fields and hide them
      setNewEntityName('')
      setNewEntityColor('')
      setShowAddEntity(false)

      // Call showEntities to fetch and display the updated entities list
      await showEntities()
    } catch (error) {
      setErrorMessage('Error adding ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }
  }

  const toggleEntities = () => {
    if (isEntitiesShown) {
      setEntities([]) // Clear entities when hiding
    } else {
      showEntities() // Fetch entities when showing
    }
    setIsEntitiesShown(!isEntitiesShown) // Toggle the state
  }

  const handleDeleteEntity = async () => {
    try {
      const q = query(collection(firestore, entityType), where('name', '==', deleteEntityName))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref)
        })
        await showEntities()
      } else {
        setErrorMessage(entityType + ' not found')
        window.alert(errorMessage)
      }
    } catch (error) {
      setErrorMessage('Error deleting ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }
    setDeleteEntityName('')
    setShowDeleteEntity(false)
  }

  const toggleEntityType = (type: 'Category' | 'Type') => {
    setEntityType(type)
    setIsEntitiesShown(false) // Hide entities when switching type
    showEntities() // Fetch entities for the new type
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <div className="absolute top-0 left-0 m-4">
        <button onClick={() => toggleEntityType('Category')} className="px-4 py-2 mb-4 mr-2 text-white rounded-full shadow-md bg-green">
          Switch to Category
        </button>
        <button onClick={() => toggleEntityType('Type')} className="px-4 py-2 mb-4 mr-2 text-white rounded-full shadow-md bg-green">
          Switch to Type
        </button>
      </div>
      <div className="flex flex-col items-center mb-4">
        <button onClick={() => setShowAddEntity(true)} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
          Add {entityType}
        </button>
        {showAddEntity && (
          <div>
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={`Enter ${entityType.toLowerCase()} name`}
              value={newEntityName}
              onChange={handleEntityNameInputChange}
            />
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder="#000000"
              value={newEntityColor}
              onChange={handleEntityColorInputChange}
              onFocus={handleEntityColorFocus}
              onBlur={handleEntityColorBlur}
            />
            <button onClick={handleAddEntity} className="px-4 py-2 mr-2 text-white rounded-full shadow-md bg-green">
              Submit
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center mb-4">
        <button onClick={() => setShowDeleteEntity(true)} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
          Delete {entityType}
        </button>
        {showDeleteEntity && (
          <div>
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={`Enter ${entityType.toLowerCase()} name`}
              value={deleteEntityName}
              onChange={(e) => setDeleteEntityName(e.target.value)}
            />
            <button onClick={handleDeleteEntity} className="px-4 py-2 mr-2 text-white rounded-full shadow-md bg-red">
              Submit
            </button>
          </div>
        )}
      </div>

      <button onClick={toggleEntities} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
        {isEntitiesShown ? `Hide ${entityType}` : `Show ${entityType}`}
      </button>
      {isEntitiesShown && (
        <div className="grid w-full max-w-4xl grid-cols-3 gap-4 p-4 text-center bg-red-100 rounded-lg">
          {entities.map((entity, index) => (
            <p key={index} className="text-black">
              {entity}
            </p>
          ))}
        </div>
      )}
      {isLoading && <LoadingOverlay isVisible={isLoading} />}
    </div>
  )
}

export default CRUDDash

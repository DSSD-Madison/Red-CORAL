import React, { useState } from 'react'
import { FirebaseApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, where, query, updateDoc } from 'firebase/firestore'
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
  const [addEntityName, setAddEntityName] = useState('')
  const [addEntitySecondProperty, setAddEntitySecondProperty] = useState('')
  const [isEntitiesShown, setIsEntitiesShown] = useState(false)
  const [deleteEntityName, setDeleteEntityName] = useState('')
  const [showDeleteEntity, setShowDeleteEntity] = useState(false)
  const [showModifyEntity, setShowModifyEntity] = useState(false)
  const [modifyEntityOldName, setModifyEntityOldName] = useState('')
  const [modifyEntityNewName, setModifyEntityNewName] = useState('')
  const [modifyEntityNewSecondProperty, setModifyEntityNewSecondProperty] = useState('')
  
  const [errorMessage, setErrorMessage] = useState('')
  const [entityType, setEntityType] = useState<'Categories' | 'Types'>('Categories') // Initialize with Category

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
    setAddEntityName(event.target.value)
  }

  const handleAddEntitySecondPropertyInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddEntitySecondProperty(event.target.value)
  }

 
  const handleAddEntity = async () => {
    try {
      if (addEntityName.trim() === '' || addEntitySecondProperty.trim() === '') {
        // Do nothing if either input field is empty
        return
      }
      if (entityType == 'Categories') {
        await addDoc(collection(firestore, entityType), {
          name: addEntityName,
          color: addEntitySecondProperty,
        })
      } else {
        await addDoc(collection(firestore, entityType), {
          name: addEntityName,
          categoryID: addEntitySecondProperty,
        })
      }

      // Clear the input fields and hide them
      setAddEntityName('')
      setAddEntitySecondProperty('')
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

  const handleModifyEntity = async () => {
    if (modifyEntityNewName.trim() === '') {
      setErrorMessage('Please enter a new name')
      window.alert(errorMessage)
      return
    }
    try {
      const q = query(collection(firestore, entityType), where('name', '==', modifyEntityOldName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          if (entityType === 'Categories') {
            await updateDoc(doc.ref, {
              name: modifyEntityNewName,
              color: modifyEntityNewSecondProperty,
            });
          } else {
            await updateDoc(doc.ref, {
              name: modifyEntityNewName,
              categoryID: modifyEntityNewSecondProperty,
            });
          }
        });
      } else {
        setErrorMessage(entityType + ' not found')
        window.alert(errorMessage)
      }
  
      // Clear the input fields and hide them
      setModifyEntityNewName('');
      setModifyEntityNewSecondProperty('');
      setModifyEntityOldName('');
      setShowModifyEntity(false);
  
      // Call showEntities to fetch and display the updated entities list
      await showEntities();
    } catch (error) {
      setErrorMessage('Error modifying ' + entityType.toLowerCase())
      window.alert(errorMessage)
    }
  };
  

  const toggleEntityType = (type: 'Category' | 'Types') => {
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
        <button onClick={() => toggleEntityType('Types')} className="px-4 py-2 mb-4 mr-2 text-white rounded-full shadow-md bg-green">
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
              value={addEntityName}
              onChange={handleEntityNameInputChange}
            />
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={entityType === 'Categories' ? 'Enter color code' : 'Enter category ID'}
              value={addEntitySecondProperty}
              onChange={handleAddEntitySecondPropertyInputChange}
        
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
      <div className="flex flex-col items-center mb-4">
        <button onClick={() => setShowModifyEntity(true)} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
          Modify {entityType}
        </button>
        {showModifyEntity && (
          <div>
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={`old name`}
              value={modifyEntityOldName}
              onChange={(e) => setModifyEntityOldName(e.target.value)}
            />
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={`new name`}
              value={modifyEntityNewName}
              onChange={(e) => setModifyEntityNewName(e.target.value)}
       
            />
            <input
              type="text"
              className="px-3 py-2 mb-2 mr-2 border border-gray-300 rounded-md"
              placeholder={entityType === 'Categories' ? 'new color code' : 'new category ID'}
              value={modifyEntityNewSecondProperty}
              onChange={(e) => setModifyEntityNewSecondProperty(e.target.value)}
            />
            <button onClick={handleModifyEntity} className="px-4 py-2 mr-2 text-white rounded-full shadow-md bg-green">
              Submit
            </button>
          </div>
        )}
      </div>

      <button onClick={toggleEntities} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
        {isEntitiesShown ? `Hide ${entityType}` : `Show ${entityType}`}
      </button>
      {isEntitiesShown && (
        <div className="grid w-full grid-cols-4 gap-3 p-4 text-center bg-red-100 rounded-lg max-w-8xl">
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

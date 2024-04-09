import React, { useState } from 'react'
import { FirebaseApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, doc, where, query, deleteDoc, queryEqual, QuerySnapshot } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import LoadingOverlay from './LoadingOverlay'

interface CrudProps {
  app: FirebaseApp
  isAdmin: boolean
}

const CRUDDash: React.FC<CrudProps> = ({ app }) => {
  const firestore = getFirestore(app)
  const storage = getStorage(app, 'gs://red-coral-map.appspot.com')
  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY

  const [data, setData] = useState({
    Categories: {},
    Types: {},
    Incidents: {},
  })

  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('')
  const [isCategoriesShown, setIsCategoriesShown] = useState(false) // State variable to track if categories are shown
  const [deleteCategoryName, setDeleteCategoryName] = useState('')

  const showCategories = async () => {
    setIsLoading(true)
    try {
      const q = collection(firestore, 'Categories')
      const querySnapshot = await getDocs(q)
      const categoriesArray: string[] = []
      querySnapshot.forEach((doc) => {
        const category = doc.data()
        categoriesArray.push(category.name)
      })
      setCategories(categoriesArray)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = () => {
    setShowAddCategory(true)
  }

  const handleCategoryNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryName(event.target.value)
  }

  const handleCategoryColorInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryColor(event.target.value)
  }

  const handleCategoryColorFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.placeholder = ''
  }

  const handleCategoryColorBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.placeholder = '#000000'
  }

  const handleCategorySubmit = async () => {
    if (newCategoryName.trim() === '' || newCategoryColor.trim() === '') {
      // Do nothing if either input field is empty
      return
    }

    try {
      await addDoc(collection(firestore, 'Categories'), {
        name: newCategoryName,
        color: newCategoryColor,
      })

      // Clear the input fields and hide them
      setNewCategoryName('')
      setNewCategoryColor('')
      setShowAddCategory(false)

      // Call showCategories to fetch and display the updated categories list
      await showCategories()
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const toggleCategories = () => {
    if (isCategoriesShown) {
      setCategories([]) // Clear categories when hiding
    } else {
      showCategories() // Fetch categories when showing
    }
    setIsCategoriesShown(!isCategoriesShown) // Toggle the state
  }

  const handleDeleteCategory = async () => {
    try {
      const q = query(collection(firestore, 'Categories'), where('name', '==', deleteCategoryName))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref)
        })
        await showCategories()
      } else {
        console.error('Category not found')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
    setDeleteCategoryName('')
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center mb-4">
      <button onClick={handleAddCategory} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
          Add Category
        </button>
        {showAddCategory && (
          <div>
            <input
              type="text"
              className="px-3 py-2 mb-2 border border-gray-300 rounded-md"
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={handleCategoryNameInputChange}
            />
            <input
              type="text"
              className="px-3 py-2 mb-2 border border-gray-300 rounded-md"
              placeholder="#000000"
              value={newCategoryColor}
              onChange={handleCategoryColorInputChange}
              onFocus={handleCategoryColorFocus}
              onBlur={handleCategoryColorBlur}
            />
            <button onClick={handleCategorySubmit} className="px-4 py-2 text-white rounded-full shadow-md bg-green">
              Submit
            </button>
          </div>
        )}
    
      </div>
      <button onClick={handleDeleteCategory} className="px-4 py-2 text-white rounded-full shadow-md bg-red">
          Delete Category
        </button>
      <div className="flex flex-col items-center mb-4">
        <input
          type="text"
          className="px-3 py-2 mb-2 border border-gray-300 rounded-md"
          placeholder="Enter category name to delete"
          value={deleteCategoryName}
          onChange={(e) => setDeleteCategoryName(e.target.value)}
        />
   
      </div>
      <button onClick={toggleCategories} className="px-4 py-2 mb-4 text-white rounded-full shadow-md bg-red">
        {isCategoriesShown ? 'Hide Categories' : 'Show Categories'}
      </button>
      {isCategoriesShown && (
        <div className="w-64 p-4 text-center bg-red-100 rounded-lg">
          {categories.map((category, index) => (
            <p key={index} className="text-black">
              {category}
            </p>
          ))}
        </div>
      )}
      {isLoading && <LoadingOverlay isVisible={isLoading} />} {/* Show loading overlay conditionally */}
    </div>
  )
}

export default CRUDDash

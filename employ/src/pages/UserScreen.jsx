import React, { useState, useEffect , useMemo} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

export default function UsersManagement() {

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [filterBy, setFilterBy] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });


  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });


  const [confirmModal, setConfirmModal] = useState({
    show: false,
    userId: null
  });

  const navigate = useNavigate();

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];


    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.first_name.toLowerCase().includes(searchTermLower) ||
        user.last_name.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower)
      );
    }


    if (sortBy) {
      result.sort((a, b) => {
        switch(sortBy) {
          case 'first_name_asc':
            return a.first_name.localeCompare(b.first_name);
          case 'first_name_desc':
            return b.first_name.localeCompare(a.first_name);
          case 'last_name_asc':
            return a.last_name.localeCompare(b.last_name);
          case 'last_name_desc':
            return b.last_name.localeCompare(a.last_name);
          case 'email_asc':
            return a.email.localeCompare(b.email);
          case 'email_desc':
            return b.email.localeCompare(a.email);
          default:
            return 0;
        }
      });
    }return result;
  }, [users, searchTerm, sortBy]);
  const Modal = ({ title, message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const modalStyles = {
      success: 'border-green-500 bg-green-50 text-green-700',
      error: 'border-red-500 bg-red-50 text-red-700'
    };

    const iconStyles = {
      success: '✓',
      error: '!'
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        
        <div 
          className={`
            ${modalStyles[type]} 
            border-2 rounded-xl shadow-2xl 
            max-w-md w-full p-6 
            flex items-center space-x-4
            
          `}
        >
          <div className={`
            w-12 h-12 rounded-full 
            ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} 
            flex items-center justify-center text-white text-2xl font-bold
          `}>
            {iconStyles[type]}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  };

  
  const ConfirmModal = ({ onConfirm, onCancel }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
          <p className="mb-6">Are you sure you want to delete this user?</p>
          <div className="flex justify-end space-x-4">
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };


  const fetchUsers = async (pageNumber) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`https://reqres.in/api/users?page=${pageNumber}`);

      setUsers(response.data.data);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await axios.put(`https://reqres.in/api/users/${editingUser.id}`, formData);
      
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...response.data } 
            : user
        )
      );


      setEditingUser(null);
      setFormData({ first_name: '', last_name: '', email: '' });

      setModal({
        show: true,
        title: 'Success',
        message: 'User updated successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Update failed', err);
      setModal({
        show: true,
        title: 'Error',
        message: 'Failed to update user',
        type: 'error'
      });
    }
  };


  const handleDeleteUser = async (userId) => {

    setConfirmModal({
      show: true,
      userId: userId
    });
  };

  const confirmDelete = async () => {
    const userId = confirmModal.userId;
    

    setConfirmModal({ show: false, userId: null });

    try {
      await axios.delete(`https://reqres.in/api/users/${userId}`);
      

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
 
      setModal({
        show: true,
        title: 'Success',
        message: 'User deleted successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Delete failed', err);
      setModal({
        show: true,
        title: 'Error',
        message: 'Failed to delete user',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const startEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 relative">
     <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      
        <div className="flex-grow ">
          <input 
            type="text"
            placeholder="Search users by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sort By</option>
          <option value="first_name_asc">First Name (A-Z)</option>
          <option value="first_name_desc">First Name (Z-A)</option>
          <option value="last_name_asc">Last Name (A-Z)</option>
          <option value="last_name_desc">Last Name (Z-A)</option>
          <option value="email_asc">Email (A-Z)</option>
          <option value="email_desc">Email (Z-A)</option>
        </select>
      </div>
      {modal.show && (
        <Modal 
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ show: false, title: '', message: '', type: 'success' })}
        />
      )}

      
      {confirmModal.show && (
        <ConfirmModal 
          onConfirm={confirmDelete}
          onCancel={() => setConfirmModal({ show: false, userId: null })}
        />
      )}


      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <form 
            onSubmit={handleUpdateUser} 
            className="bg-white w-96 p-8 rounded-xl shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-6 text-center">
              Edit User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}


      <h2 className="text-2xl font-bold mb-6 text-center">
        User List
      </h2>


      {isLoading && <div className="text-center text-xl">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}


      {!isLoading && !error && (
        <div>
     
          <p className="mb-4 text-gray-600">
            {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredAndSortedUsers.map((user) => (
              <div 
                key={user.id} 
                className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center"
              >
               
                <img 
                  src={user.avatar} 
                  alt={`${user.first_name} ${user.last_name}`} 
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-gray-500">{user.email}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditUser(user)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className=" text-white px-3 py-1 bg-red-500 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-center mt-6 space-x-4">
        <button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-lg font-semibold">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import UserForm from '../../components/UserForm'; // Import UserForm

function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: adminUser } = useAuth();
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const fileInputRef = useRef(null);

  const fetchUsers = async () => {
    if (adminUser?.role !== 'admin') {
      setError('Access Denied: You do not have permission to view this page.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest('/users', 'GET');
      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser]);

  const handleCreateUser = async (userData) => {
    try {
      // Debug: log payload (without password value length only)
      // eslint-disable-next-line no-console
      console.log('[Admin] Create user payload', {
        ...userData,
        password: userData.password ? `len:${userData.password.length}` : undefined,
      });
      const newUser = await apiRequest('/users', 'POST', userData);
      // eslint-disable-next-line no-console
      console.log('[Admin] Create user response', newUser);
      setUsers([newUser.user, ...users]); // Backend returns { message, user: newUser.rows[0] }
      setShowCreateUserModal(false);
      setError(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(`Error creating user: ${err.message}`);
    }
  };

  const handleEditUserClick = async (userToEdit) => {
    try {
      // Fetch full user with profile to ensure prefill
      const full = await apiRequest(`/users/${userToEdit.user_id}`, 'GET');
      setEditingUser(full);
      setShowEditUserModal(true);
      setError(null);
    } catch (e) {
      console.error('Error fetching user for edit:', e);
      setError(`Failed to load user for edit: ${e.message}`);
    }
  };

  const handleUpdateUser = async (userData) => {
    if (!editingUser) return;
    try {
      // Debug: log update request
      // eslint-disable-next-line no-console
      console.log('[Admin] Update user payload', { id: editingUser.user_id, body: userData });
      const updatedUserResponse = await apiRequest(
        `/users/${editingUser.user_id}`,
        'PUT',
        userData
      );
      // eslint-disable-next-line no-console
      console.log('[Admin] Update user response', updatedUserResponse);
      // Assuming backend returns { message, user: result.rows[0] }
      const updatedUser = updatedUserResponse.user;
      setUsers(
        users.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
      );
      setShowEditUserModal(false);
      setEditingUser(null);
      setError(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(`Error updating user: ${err.message}`);
    }
  };

  const handleDeleteUserClick = async (userId) => {
    // eslint-disable-next-line no-restricted-globals
    if (
      confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      try {
        await apiRequest(`/users/${userId}`, 'DELETE');
        setUsers(users.filter((u) => u.user_id !== userId));
        setError(null);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(`Error deleting user: ${err.message}`);
      }
    }
  };

  // --- Bulk Import Helpers ---
  const requiredHeaders = [
    'email',
    'firstName',
    'lastName',
    'role',
  ];

  const parseCsv = (text) => {
    // Simple CSV parser (supports quoted values, commas inside quotes)
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const tokenize = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result.map((s) => s.trim());
    };

    const headers = tokenize(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => tokenize(line));
    const objects = rows.map((cols, idx) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (cols[i] || '').replace(/^"|"$/g, '').trim();
      });
      obj.__row = idx + 2; // 1-based with header
      return obj;
    });
    return { headers, rows: objects };
  };

  const onCsvChosen = async (file) => {
    setImportErrors([]);
    setImportSummary(null);
    setPreviewRows([]);
    setParsedRows([]);
    setProcessedCount(0);
    setSuccessCount(0);
    setSkipCount(0);
    setUploadFileName(file ? file.name : '');
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length) {
      setImportErrors([{
        row: 0,
        field: 'headers',
        message: `Missing required headers: ${missing.join(', ')}`,
      }]);
      return;
    }
    setParsedRows(rows);
    setPreviewRows(rows.slice(0, 10));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      await onCsvChosen(dt.files[0]);
    }
  };

  const downloadSampleCsv = () => {
    const headers = 'email,firstName,lastName,role,matricNo,department,course,level,lecturerNo,faculty,office,phone,password\n';
    const rows = [
      'jane.smith@example.com,Jane,Smith,student,STU0001,Computer Science,BSc Computer Science,200,,,,+15551234567,Passw0rd!',
      'john.doe@example.com,John,Doe,teacher,,, , ,LEC0001,Engineering,Room 101,+15559876543,Passw0rd!',
    ].join('\n');
    const blob = new Blob([headers + rows + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_bulk_users.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadErrorsCsv = () => {
    if (!importErrors.length) return;
    const headers = 'row,field,message\n';
    const lines = importErrors.map((e) => `${e.row},${e.field},"${(e.message || '').replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([headers + lines + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const normalizeRole = (r) => (r || '').toLowerCase().trim();

  const toUserPayload = (row) => {
    const role = normalizeRole(row.role);
    const base = {
      email: (row.email || '').toLowerCase(),
      password: row.password && row.password.length >= 6 ? row.password : 'Passw0rd!',
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      role,
    };
    if (role === 'student') {
      base.profileStudent = {
        matricNo: row.matricNo || row.matric_no || '',
        department: row.department || '',
        course: row.course || '',
        level: row.level || '',
        phone: row.phone || null,
      };
    } else if (role === 'teacher') {
      base.profileTeacher = {
        lecturerNo: row.lecturerNo || row.lecturer_no || '',
        department: row.department || '',
        faculty: row.faculty || '',
        office: row.office || '',
        phone: row.phone || null,
      };
    }
    return base;
  };

  const startImport = async () => {
    if (!parsedRows.length) return;
    setImportBusy(true);
    setImportErrors([]);
    setImportSummary(null);
    setProcessedCount(0);
    setSuccessCount(0);
    setSkipCount(0);

    try {
      // Validate minimally before sending
      const preErrors = [];
      const filtered = parsedRows.filter((row) => {
        const role = normalizeRole(row.role);
        const hasReq = row.email && row.firstName && row.lastName && row.role;
        if (!hasReq) {
          preErrors.push({ row: row.__row, field: 'required', message: 'Missing required base fields' });
          return false;
        }
        if (!['student', 'teacher'].includes(role)) {
          preErrors.push({ row: row.__row, field: 'role', message: 'Only student or teacher roles can be imported' });
          return false;
        }
        return true;
      });

      const payloadRows = filtered.map((r) => ({
        email: (r.email || '').toLowerCase(),
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        role: normalizeRole(r.role),
        matricNo: r.matricNo || r.matric_no || '',
        department: r.department || '',
        course: r.course || '',
        level: r.level || '',
        lecturerNo: r.lecturerNo || r.lecturer_no || '',
        faculty: r.faculty || '',
        office: r.office || '',
        phone: r.phone || '',
        password: (r.password || '').trim(), // backend will derive if blank
      }));

      const result = await apiRequest('/users/import', 'POST', { rows: payloadRows });
      const total = result?.total ?? payloadRows.length;
      const created = result?.created ?? 0;
      const skipped = result?.skipped ?? 0;
      const errors = Array.isArray(result?.errors) ? result.errors : [];

      setProcessedCount(total);
      setSuccessCount(created);
      setSkipCount(skipped);
      setImportSummary({ total, created, skipped });
      setImportErrors([...preErrors, ...errors]);
      if (created > 0) {
        await fetchUsers();
      }
    } catch (e) {
      setImportErrors([{ row: 0, field: 'api', message: e.message || 'Import failed' }]);
    } finally {
      setImportBusy(false);
    }
  };

  if (adminUser?.role !== 'admin') {
    return <div>{error || 'Access Denied. Requires Admin privileges.'}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchUsers}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and permissions</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="btn btn-secondary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M4 4h16M4 8h16" />
                </svg>
                Bulk Import
              </button>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="btn btn-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Users Table */}
        {users.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Users ({users.length})</h2>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Profile ID</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td className="font-mono text-sm">{user.user_id}</td>
                        <td className="font-medium">{user.email}</td>
                        <td>
                          <div>
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                          </div>
                        </td>
                        <td className="font-mono text-sm">
                          {user.role === 'student' && user.profile?.matric_no ? (
                            <span>{user.profile.matric_no}</span>
                          ) : user.role === 'teacher' && user.profile?.lecturer_no ? (
                            <span>{user.profile.lecturer_no}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            user.role === 'admin' ? 'badge-error' :
                            user.role === 'teacher' ? 'badge-success' :
                            'badge-info'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="text-sm text-gray-600">
                          {(() => {
                            const d = user.created_at ? new Date(user.created_at) : null;
                            return d && !isNaN(d.getTime())
                              ? d.toLocaleDateString()
                              : '—';
                          })()}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditUserClick(user)}
                              className="btn btn-secondary btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUserClick(user.user_id)}
                              className="btn btn-danger btn-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          !error && !loading && (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first user account.</p>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="btn btn-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New User
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <Modal
        title="Create New User"
        show={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateUserModal(false)}
        />
      </Modal>

      {editingUser && (
        <Modal
          title={`Edit User: ${editingUser.email}`}
          show={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setEditingUser(null);
          }}
        >
          <UserForm
            onSubmit={handleUpdateUser}
            initialData={editingUser}
            onCancel={() => {
              setShowEditUserModal(false);
              setEditingUser(null);
            }}
            isEditMode={true}
          />
        </Modal>
      )}

      {/* Bulk Import Modal */}
      <Modal
        title="Bulk Import Users"
        show={showBulkImportModal}
        onClose={() => {
          if (importBusy) return;
          setShowBulkImportModal(false);
          setImportErrors([]);
          setImportSummary(null);
          setPreviewRows([]);
          setParsedRows([]);
          setProcessedCount(0);
          setSuccessCount(0);
          setSkipCount(0);
          setUploadFileName('');
        }}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="text-sm text-gray-700">
            <p className="mb-2">Upload a CSV with headers:</p>
            <code className="block p-2 bg-gray-100 rounded">
              email, firstName, lastName, role, matricNo, department, course, level, lecturerNo, faculty, office, phone, password
            </code>
            <div className="flex items-center gap-2 mt-2">
              <button className="btn btn-secondary btn-sm" onClick={downloadSampleCsv} disabled={importBusy}>Download sample CSV</button>
              {importErrors.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={downloadErrorsCsv} disabled={importBusy}>Download error report</button>
              )}
            </div>
            <p className="mt-2">Roles supported: <strong>student</strong>, <strong>teacher</strong>. Others will be skipped.</p>
          </div>

          <div
            className={`border-2 rounded-lg p-6 text-center ${dragActive ? 'border-primary bg-primary-50' : 'border-dashed border-gray-300 bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="mb-2">
              {uploadFileName ? (
                <span><strong>Selected:</strong> {uploadFileName}</span>
              ) : (
                <span>Drag & drop CSV file here or click to choose</span>
              )}
            </p>
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={importBusy}
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => onCsvChosen(e.target.files && e.target.files[0])}
                disabled={importBusy}
              />
            </div>
          </div>

          {parsedRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="card">
                <div className="card-body">
                  <h4 className="font-medium mb-2">Header checklist</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {requiredHeaders.map((h) => (
                      <li key={h}>
                        <span className="mr-2">{h}</span>
                        <span className="badge badge-success">ok</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <h4 className="font-medium mb-2">Counts</h4>
                  <div className="text-sm text-gray-700">Total: {parsedRows.length}</div>
                  <div className="text-sm text-gray-700">Processed: {processedCount}</div>
                  <div className="text-sm text-green-700">Created: {successCount}</div>
                  <div className="text-sm text-amber-700">Skipped: {skipCount}</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <h4 className="font-medium mb-2">Progress</h4>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className="bg-primary h-2 rounded"
                      style={{ width: `${parsedRows.length ? Math.min(100, Math.round((processedCount / parsedRows.length) * 100)) : 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {parsedRows.length ? Math.min(100, Math.round((processedCount / parsedRows.length) * 100)) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="mt-2">
              <h4 className="font-medium mb-2">Preview (first {previewRows.length} rows)</h4>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.__row}</td>
                        <td>{r.email}</td>
                        <td>{r.firstName} {r.lastName}</td>
                        <td>{r.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="alert alert-error">
              <div>
                <strong>Errors:</strong>
                <ul className="list-disc ml-6">
                  {importErrors.slice(0, 10).map((e, i) => (
                    <li key={`${e.row}-${i}`}>Row {e.row}: {e.field} - {e.message}</li>
                  ))}
                </ul>
                {importErrors.length > 10 && (
                  <div className="text-sm text-gray-600 mt-2">Showing first 10 of {importErrors.length} errors.</div>
                )}
              </div>
            </div>
          )}

          {importSummary && (
            <div className="alert alert-success">
              <div>
                Imported {importSummary.created} of {importSummary.total}. Skipped {importSummary.skipped}.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (importBusy) return;
                setShowBulkImportModal(false);
                setImportErrors([]);
                setImportSummary(null);
                setPreviewRows([]);
                setParsedRows([]);
                setProcessedCount(0);
                setSuccessCount(0);
                setSkipCount(0);
                setUploadFileName('');
              }}
              disabled={importBusy}
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={startImport}
              disabled={importBusy || parsedRows.length === 0}
            >
              {importBusy ? 'Importing…' : 'Start Import'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminUserManagementPage;

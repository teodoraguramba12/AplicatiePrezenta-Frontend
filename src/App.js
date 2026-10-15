import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import sigla from './Imagini/Sigla Busuiocul.png';

// --- Pagina Principală de Login ---
function Home() {
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    if (token) {
      // Salvăm tokenul întâlnirii scanate în localStorage ca să nu se piardă la logare
      localStorage.setItem('pendingMeetingToken', token);
    }
  }, [location]);

  const handleGoogleLogin = (e) => {
    e.preventDefault(); // Oprește orice comportament nativ de formular dacă există
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  
  };

  return (
    <div className="main-container">
      {/* Modelul decorativ din stânga */}
      <div className="side-pattern left-pattern"></div>

      <div className="content-center">
        <img src={sigla} alt="Sigla Ansamblul Busuiocul" className="logo" />
        <div className="text-container">
          <p className="subtitle">Aplicația de prezență a membrilor</p>
          <h2 className="title">Ansamblului Folcloric Profesionist „Busuiocul”- Bacău</h2>
        </div>
        <button className="custom-btn" onClick={handleGoogleLogin}>
          Autentificare cu Google pentru Prezență
        </button>
      </div>

      {/* Modelul decorativ din dreapta (adaugă-l dacă lipsea) */}
      <div className="side-pattern right-pattern"></div>
    </div>
  );
}


// --- Pagina de Angajat ---
function AngajatPage() {
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
    }

    // Verificăm dacă există un token de întâlnire așteptând să fie înregistrat
    const pendingMeetingToken = localStorage.getItem('pendingMeetingToken');
    const jwtToken = localStorage.getItem('jwtToken');

    if (pendingMeetingToken && jwtToken) {
      // Trimitem cererea de înregistrare a prezenței la backend
      fetch('http://192.168.2.17:8080/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ qrCodeData: pendingMeetingToken })
      })
        .then(async res => {
          if (res.ok) {
            alert("Prezența a fost înregistrată cu succes!");
            localStorage.removeItem('pendingMeetingToken'); // Ștergem tokenul să nu se reînregistreze la infinit
          } else {
            const errData = await res.json().catch(() => ({}));
            alert("Eroare la înregistrarea prezenței: " + (errData.error || "Eroare necunoscută"));
            localStorage.removeItem('pendingMeetingToken');
          }
        })
        .catch(err => {
          console.error("Eroare de conexiune:", err);
        });
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('pendingMeetingToken');
    window.location.href = "/";
  };

  return (
    <div className="main-container">
      <div className="side-pattern left-pattern"></div>

      <div className="content-center">
        <img src={sigla} alt="Sigla Busuiocul" className="logo" />
        
        <div className="text-container" style={{ marginTop: '10px' }}>
          <h2 className="title" style={{ fontSize: '28px', lineHeight: '1.3' }}>
            Bun venit în panou!<br />Prezența se înregistrează automat.
          </h2>
        </div>
      </div>

      <div className="side-pattern right-pattern"></div>

      <div style={{ position: 'absolute', top: '20px', right: '80px', textAlign: 'right', zIndex: 10, fontFamily: 'Alfa Slab One, serif' }}>
        <p style={{ margin: 0, color: '#521616', fontSize: '16px' }}>Angajat</p>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: 'none', color: '#b22222', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// --- Pagina de Admin ---
function AdminPage() {
  const location = useLocation();
  const [meetingCreated, setMeetingCreated] = useState(false);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    window.location.href = "/";
  };

  const handleCreeazaIntalnire = () => {
    fetch('http://localhost:8080/api/meetings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} - ${text}`);
        }
        return res.json();
      })
      .then(data => {
        // Link corect pentru frontend (port 3000) care conține tokenul întâlnirii
        const scanUrl = `http://localhost:3002/?token=${data.uniqueToken}`;
        setQrData(scanUrl);
        setMeetingCreated(true);
      })
      .catch(err => {
        console.error("Eroare detaliată la crearea întâlnirii:", err);
        alert("Eroare detaliată: " + err.message);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      fetch('http://localhost:8080/api/auth/role', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.role === 'STUDENT' && window.location.pathname.includes('/admin')) {
            window.location.href = '/angajat';
          }
        })
        .catch(err => console.error("Eroare la verificare rol:", err));
    }
  }, []);

  return (
    <div className="main-container">
      <div className="side-pattern left-pattern"></div>

      <div className="content-center">
        <img src={sigla} alt="Sigla Busuiocul" className="logo" />
        
        <div className="text-container" style={{ marginTop: '10px' }}>
          <h2 className="title" style={{ fontSize: '24px', lineHeight: '1.3' }}>
            Panou de control<br />Admin
          </h2>
        </div>
        
        {!meetingCreated ? (
          <>
            <button 
              className="custom-btn" 
              style={{ backgroundColor: '#2E8B57', marginTop: '15px' }}
              onClick={handleCreeazaIntalnire}
            >
              Creează o întâlnire nouă
            </button>

            <button 
              onClick={() => window.location.href = "/admin/database"}
              style={{
                backgroundColor: '#6B2D2F',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'Arial, sans-serif',
                marginTop: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Verifică baza de date
            </button>

            <button 
              onClick={() => window.location.href = "/admin/users"}
              style={{
                backgroundColor: '#4A4A4A',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'Arial, sans-serif',
                marginTop: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              👥 Gestionează Utilizatorii
            </button>
          </>
        ) : (
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <p style={{ color: '#521616', fontWeight: 'bold', marginBottom: '10px' }}>
              Codul QR pentru prezență:
            </p>
            
            <div 
              style={{ 
                background: 'white', 
                padding: '20px', 
                display: 'inline-block', 
                borderRadius: '15px', 
                boxShadow: '0 6px 10px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('qrModal').style.display = 'flex'}
            >
              <QRCodeSVG value={qrData} size={300} />
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Click pe cod pentru mărire</p>
            
            <br />
            <button 
              onClick={() => setMeetingCreated(false)}
              style={{
                backgroundColor: '#521616',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                marginTop: '15px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Înapoi la Panou
            </button>

            <div 
              id="qrModal"
              style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.9)',
                zIndex: 1000,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                cursor: 'zoom-out'
              }}
              onClick={() => document.getElementById('qrModal').style.display = 'none'}
            >
              <p style={{ color: 'white', marginBottom: '15px', fontSize: '16px' }}>Cod QR (Click oriunde pentru a închide)</p>
              <div style={{ background: 'white', padding: '40px', borderRadius: '20px' }}>
                <QRCodeSVG value={qrData} size={500} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="side-pattern right-pattern"></div>

      <div style={{ position: 'absolute', top: '20px', right: '80px', textAlign: 'right', zIndex: 10, fontFamily: 'Alfa Slab One, serif' }}>
        <p style={{ margin: 0, color: '#521616', fontSize: '15px' }}>Admin-Dirijor</p>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: 'none', color: '#b22222', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// --- Pagina de Gestionare Utilizatori ---
function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    fetch('http://localhost:8080/api/users/all')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Eroare la preluarea utilizatorilor:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId, currentRole) => {
    const newRole = currentRole === 'TEACHER' ? 'STUDENT' : 'TEACHER';
    
    fetch(`http://localhost:8080/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    })
      .then(res => {
        if (res.ok) {
          fetchUsers();
        } else {
          alert('Eroare la schimbarea rolului!');
        }
      });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Sigur doriți să ștergeți acest utilizator?")) {
      fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (res.ok) {
            fetchUsers();
          } else {
            alert('Eroare la ștergerea utilizatorului!');
          }
        });
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#521616', fontFamily: 'Alfa Slab One, serif' }}>
        👥 Gestionare Utilizatori și Roluri
      </h2>

      {loading ? (
        <p>Se încarcă utilizatorii...</p>
      ) : (
        <div style={{ maxWidth: '900px', margin: '20px auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#521616', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nume / Prenume</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Rol Curent</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ textAlign: 'center' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.nume || 'N/A'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.email}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: u.role === 'TEACHER' ? '#b22222' : '#2E8B57' }}>
                    {u.role}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button 
                      onClick={() => handleRoleChange(u.id, u.role)}
                      style={{ backgroundColor: '#4A4A4A', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
                    >
                      Schimbă Rol
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ backgroundColor: '#b22222', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <br />
      <button 
        onClick={() => window.location.href = "/admin"}
        style={{ backgroundColor: '#521616', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
      >
        Înapoi la Panou Admin
      </button>
    </div>
  );
}

// --- Pagina de vizualizare Bază de Date Avansată pentru Admin (cu Arhivă) ---
function DatabaseViewPage() {
  const [summaryList, setSummaryList] = useState([]);
  const [detailedList, setDetailedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('summary');
  const [selectedTitle, setSelectedTitle] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/attendance/summary')
      .then(res => res.json())
      .then(data => {
        const sortedData = data.sort((a, b) => b.meetingId - a.meetingId);
        setSummaryList(sortedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Eroare la preluarea sumarului:", err);
        setLoading(false);
      });
  }, []);

  const handleViewMeetingDetails = (meetingId) => {
    fetch(`http://localhost:8080/api/attendance/all`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(item => item.meeting && item.meeting.id === meetingId);
        setDetailedList(filtered);
        setSelectedTitle(`Întâlnirea ID: ${meetingId}`);
        setView('details');
      });
  };

  const activeMeetings = summaryList.slice(0, 30);
  const archivedMeetings = summaryList.slice(30);

  return (
    <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#521616', fontFamily: 'Alfa Slab One, serif' }}>
        {view === 'summary' && 'Registrul Prezențelor - Ultimele Întâlniri'}
        {view === 'archive' && 'Arhiva Întâlnirilor Anterioare'}
        {view === 'details' && selectedTitle}
      </h2>

      {loading ? (
        <p>Se încarcă datele...</p>
      ) : view === 'summary' ? (
        <div>
          <div style={{ maxWidth: '800px', margin: '20px auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#521616', color: 'white' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID Întâlnire</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nr. Angajați Înregistrați</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Data Întâlnirii</th>
                </tr>
              </thead>
              <tbody>
                {activeMeetings.map((item) => (
                  <tr key={item.meetingId} style={{ textAlign: 'center' }}>
                    <td 
                      style={{ padding: '10px', border: '1px solid #ddd', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleViewMeetingDetails(item.meetingId)}
                    >
                      {item.meetingId}
                    </td>
                    <td 
                      style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2E8B57', cursor: 'pointer' }}
                      onClick={() => handleViewMeetingDetails(item.meetingId)}
                    >
                      {item.registeredCount}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {item.meetingDate ? new Date(item.meetingDate).toLocaleDateString('ro-RO') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {archivedMeetings.length > 0 && (
            <button 
              onClick={() => setView('archive')}
              style={{ backgroundColor: '#2E8B57', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}
            >
              📁 Vezi Arhiva Întâlnirilor Mai Vechi ({archivedMeetings.length})
            </button>
          )}
        </div>
      ) : view === 'archive' ? (
        <div>
          <div style={{ maxWidth: '800px', margin: '20px auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#4A4A4A', color: 'white' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID Întâlnire</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nr. Angajați Înregistrați</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>Data Întâlnirii</th>
                </tr>
              </thead>
              <tbody>
                {archivedMeetings.map((item) => (
                  <tr key={item.meetingId} style={{ textAlign: 'center' }}>
                    <td 
                      style={{ padding: '10px', border: '1px solid #ddd', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleViewMeetingDetails(item.meetingId)}
                    >
                      {item.meetingId}
                    </td>
                    <td 
                      style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2E8B57', cursor: 'pointer' }}
                      onClick={() => handleViewMeetingDetails(item.meetingId)}
                    >
                      {item.registeredCount}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {item.meetingDate ? new Date(item.meetingDate).toLocaleDateString('ro-RO') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={() => setView('summary')}
            style={{ backgroundColor: '#6B2D2F', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Înapoi la Ultimele Întâlniri
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '20px auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#2E8B57', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID Înregistrare</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Email Angajat</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID Întâlnire</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Data și Ora Scanării</th>
              </tr>
            </thead>
            <tbody>
              {detailedList.map((row) => (
                <tr key={row.id} style={{ textAlign: 'center' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.user ? row.user.email : 'N/A'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.meeting ? row.meeting.id : 'N/A'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {new Date(row.scanTime).toLocaleString('ro-RO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <br />
          <button 
            onClick={() => setView('summary')}
            style={{ backgroundColor: '#6B2D2F', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Înapoi la Sumar
          </button>
        </div>
      )}

      {view === 'summary' && (
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => window.location.href = "/admin"}
            style={{ backgroundColor: '#521616', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', marginRight: '10px' }}
          >
            Înapoi la Panou Admin
          </button>

          <button 
            onClick={() => window.open('http://localhost:8080/api/attendance/export', '_blank')}
            style={{ backgroundColor: '#2E8B57', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📊 Descarcă Raportul Complet (Excel / CSV)
          </button>
        </div>
      )}
    </div>
  );
}

// --- Ruterul Principal ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/angajat" element={<AngajatPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/database" element={<DatabaseViewPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
      </Routes>
    </Router>
  );
}

export default App;
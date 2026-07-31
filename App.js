import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#bb901e';
const GOLD_LIGHT = '#d4a832';
const DARK = '#0a0e17';
const DARKER = '#060810';
const CARD = '#0f1520';
const BORDER = 'rgba(187,144,30,0.2)';
const MUTED = '#7a8a9a';
const WHITE = '#f0f0f0';
const GREEN = '#27ae60';
const RED = '#c0392b';
const BLUE = '#1a3a5c';

const API_BASE = 'https://base44.app/api/apps/6a2ba35443a73e3d0cbd1deb';
const ENTITY_FACES = API_BASE + '/entities/EnrolledFace';
const ENTITY_EVENTS = API_BASE + '/entities/LockEvent';

const Tab = createBottomTabNavigator();

// System types
const SYSTEMS = [
  { id: 'home', name: 'G-Lock Home', sub: 'Front Door', icon: 'home-outline', activeIcon: 'home', color: GOLD },
  { id: 'ride', name: 'G-Lock Ride', sub: 'E-Bike / Motorbike', icon: 'bicycle-outline', activeIcon: 'bicycle', color: GOLD },
];

// ============ DASHBOARD SCREEN ============
function DashboardScreen({ navigation }) {
  const [activeSystem, setActiveSystem] = useState('home');
  const [armed, setArmed] = useState({ home: false, ride: false });
  const [faces, setFaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [facesRes, eventsRes] = await Promise.all([
        fetch(ENTITY_FACES + '?limit=100').then(r => r.json()),
        fetch(ENTITY_EVENTS + '?limit=10&sort=-created_date').then(r => r.json()),
      ]);
      setFaces(facesRes.data || facesRes || []);
      setEvents(eventsRes.data || eventsRes || []);
    } catch (e) {
      // offline mode
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleArm() {
    setArmed(prev => ({ ...prev, [activeSystem]: !prev[activeSystem] }));
    const systemName = activeSystem === 'home' ? 'G-Lock Home' : 'G-Lock Ride';
    fetch(ENTITY_EVENTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: !armed[activeSystem] ? 'ARM' : 'DISARM',
        person_identified: 'Owner',
        confidence_score: 100,
        camera_source: systemName + ' App',
        timestamp: new Date().toISOString(),
        action_taken: (!armed[activeSystem] ? 'System Armed' : 'System Disarmed') + ' - ' + systemName,
        notified_owner: true
      })
    }).catch(() => {});
  }

  const currentSystem = SYSTEMS.find(s => s.id === activeSystem);
  const isArmed = armed[activeSystem];

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoBadge}><Text style={s.logoBadgeText}>GL</Text></View>
            <View>
              <Text style={s.appTitle}>G-Lock</Text>
              <Text style={s.appSubtitle}>HomeGuard</Text>
            </View>
          </View>
          <Text style={s.patentBadge}>Patent 2613849.5</Text>
        </View>

        {/* System Selector */}
        <Text style={s.selectorLabel}>SELECT SYSTEM</Text>
        <View style={s.systemSelector}>
          {SYSTEMS.map(sys => (
            <TouchableOpacity
              key={sys.id}
              style={[s.systemTab, activeSystem === sys.id && s.systemTabActive]}
              onPress={() => setActiveSystem(sys.id)}
            >
              <Ionicons
                name={activeSystem === sys.id ? sys.activeIcon : sys.icon}
                size={20}
                color={activeSystem === sys.id ? '#000' : MUTED}
              />
              <View>
                <Text style={[s.systemTabName, activeSystem === sys.id && s.systemTabNameActive]}>
                  {sys.name}
                </Text>
                <Text style={[s.systemTabSub, activeSystem === sys.id && s.systemTabSubActive]}>
                  {sys.sub}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Card */}
        <View style={[s.statusCard, isArmed ? s.statusArmed : s.statusDisarmed]}>
          <View style={s.statusIconWrap}>
            <Ionicons
              name={isArmed ? 'shield-checkmark' : 'shield-outline'}
              size={48}
              color={isArmed ? GREEN : MUTED}
            />
          </View>
          <Text style={s.statusLabel}>{currentSystem.name.toUpperCase()} STATUS</Text>
          <Text style={[s.statusValue, { color: isArmed ? GREEN : MUTED }]}>
            {isArmed ? 'ARMED' : 'DISARMED'}
          </Text>
          <Text style={s.statusSub}>
            {isArmed
              ? activeSystem === 'home' ? 'Your home is secured' : 'Your ride is protected'
              : activeSystem === 'home' ? 'Front door is unlocked' : 'Bike is not immobilized'}
          </Text>
          <TouchableOpacity
            style={[s.armBtn, isArmed ? s.disarmBtn : s.armBtnActive]}
            onPress={toggleArm}
          >
            <Ionicons name={isArmed ? 'unlock-outline' : 'lock-closed'} size={20} color={isArmed ? '#fff' : '#000'} />
            <Text style={[s.armBtnText, { color: isArmed ? '#fff' : '#000' }]}>
              {isArmed ? 'DISARM ' + currentSystem.name.toUpperCase() : 'ARM ' + currentSystem.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="people" size={24} color={GOLD} />
            <Text style={s.statNum}>{loading ? '...' : faces.length}</Text>
            <Text style={s.statLabel}>Enrolled Faces</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name={activeSystem === 'home' ? 'lock-closed' : 'bicycle'} size={24} color={GOLD} />
            <Text style={s.statNum}>{isArmed ? 'ON' : 'OFF'}</Text>
            <Text style={s.statLabel}>{currentSystem.sub}</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="notifications" size={24} color={GOLD} />
            <Text style={s.statNum}>{loading ? '...' : events.length}</Text>
            <Text style={s.statLabel}>Recent Events</Text>
          </View>
        </View>

        {/* System Info Cards */}
        <Text style={s.sectionTitle}>Your Systems</Text>
        {SYSTEMS.map(sys => {
          const sysArmed = armed[sys.id];
          return (
            <View key={sys.id} style={s.systemCard}>
              <View style={[s.systemCardIcon, { backgroundColor: sysArmed ? 'rgba(39,174,96,0.15)' : 'rgba(187,144,30,0.1)' }]}>
                <Ionicons name={sys.activeIcon} size={28} color={sysArmed ? GREEN : GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.systemCardName}>{sys.name}</Text>
                <Text style={s.systemCardSub}>{sys.sub}</Text>
                <View style={[s.systemStatusBadge, { backgroundColor: sysArmed ? GREEN : 'rgba(122,138,154,0.2)' }]}>
                  <Text style={[s.systemStatusText, { color: sysArmed ? '#fff' : MUTED }]}>
                    {sysArmed ? 'ARMED' : 'DISARMED'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.systemCardBtn, sysArmed ? s.systemCardBtnDisarm : s.systemCardBtnArm]}
                onPress={() => {
                  setActiveSystem(sys.id);
                  setTimeout(() => {
                    setArmed(prev => ({ ...prev, [sys.id]: !prev[sys.id] }));
                    fetch(ENTITY_EVENTS, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event_type: !sysArmed ? 'ARM' : 'DISARM',
                        person_identified: 'Owner',
                        confidence_score: 100,
                        camera_source: sys.name + ' App',
                        timestamp: new Date().toISOString(),
                        action_taken: (!sysArmed ? 'System Armed' : 'System Disarmed') + ' - ' + sys.name,
                        notified_owner: true
                      })
                    }).catch(() => {});
                  }, 100);
                }}
              >
                <Ionicons name={sysArmed ? 'unlock-outline' : 'lock-closed'} size={18} color={sysArmed ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Recent Activity */}
        <Text style={s.sectionTitle}>Recent Activity</Text>
        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} />
        ) : events.length === 0 ? (
          <Text style={s.emptyText}>No recent activity</Text>
        ) : (
          events.slice(0, 5).map((evt, i) => (
            <View key={i} style={s.eventCard}>
              <View style={[s.eventDot, { backgroundColor: (evt.event_type || '').toUpperCase() === 'ARM' ? GREEN : (evt.event_type || '').toUpperCase() === 'ALERT' ? RED : GOLD }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.eventType}>{evt.event_type || 'EVENT'}</Text>
                <Text style={s.eventDetail}>{evt.action_taken || evt.person_identified || 'System activity'}</Text>
                <Text style={s.eventTime}>{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : ''}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ FACES SCREEN ============
function FacesScreen() {
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFaces = useCallback(async () => {
    try {
      const res = await fetch(ENTITY_FACES + '?limit=100');
      const data = await res.json();
      setFaces(data.data || data || []);
    } catch (e) {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  function addFace() {
    Alert.alert('Face Enrollment', 'Camera enrollment will be available in the next update. For now, faces can be enrolled via the web dashboard.');
  }

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Enrolled Faces</Text>
        <TouchableOpacity style={s.addBtn} onPress={addFace}>
          <Ionicons name="person-add" size={20} color="#000" />
          <Text style={s.addBtnText}>Add Face</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={GOLD} size="large" style={{ marginTop: 40 }} />
      ) : faces.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="people-outline" size={64} color={BORDER} />
          <Text style={s.emptyTitle}>No Faces Enrolled</Text>
          <Text style={s.emptySub}>Tap "Add Face" to enroll your first face</Text>
        </View>
      ) : (
        <FlatList
          data={faces}
          keyExtractor={(item, i) => item.id || i.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={s.faceCard}>
              <View style={s.faceAvatar}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={s.faceImage} />
                ) : (
                  <Ionicons name="person" size={32} color={GOLD} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.faceName}>{item.name || 'Unknown'}</Text>
                <Text style={s.faceRole}>{item.role || 'Member'}</Text>
                <Text style={s.faceStatus}>Status: {item.status || 'Active'}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: item.status === 'Active' ? GREEN : MUTED }]}>
                <Text style={s.statusText}>{item.status || 'Active'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ============ ACTIVITY SCREEN ============
function ActivityScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(ENTITY_EVENTS + '?limit=50&sort=-created_date');
      const data = await res.json();
      setEvents(data.data || data || []);
    } catch (e) {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filtered = filter === 'ALL' ? events : events.filter(e => (e.event_type || '').toUpperCase() === filter);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Activity Log</Text>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        {['ALL', 'ARM', 'ALERT', 'ENROLL'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, filter === f && s.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={GOLD} size="large" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={BORDER} />
          <Text style={s.emptyTitle}>No Events</Text>
          <Text style={s.emptySub}>Activity will appear here when the system is in use</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id || i.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={s.eventCard}>
              <View style={[s.eventDot, {
                backgroundColor: (item.event_type || '').toUpperCase() === 'ARM' ? GREEN :
                  (item.event_type || '').toUpperCase() === 'ALERT' ? RED :
                  (item.event_type || '').toUpperCase() === 'ENROLL' ? GOLD : MUTED
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.eventType}>{item.event_type || 'EVENT'}</Text>
                <Text style={s.eventDetail}>{item.action_taken || item.person_identified || 'System activity'}</Text>
                <Text style={s.eventMeta}>
                  {item.camera_source ? item.camera_source + ' · ' : ''}
                  {item.confidence_score ? Math.round(item.confidence_score) + '% confidence' : ''}
                </Text>
                <Text style={s.eventTime}>
                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : (item.created_date ? new Date(item.created_date).toLocaleString() : '')}
                </Text>
              </View>
              {item.notified_owner && (
                <Ionicons name="notifications" size={16} color={GOLD} style={{ marginTop: 4 }} />
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ============ SETTINGS SCREEN ============
function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoArm, setAutoArm] = useState(false);
  const [gpsTrack, setGpsTrack] = useState(true);

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Settings</Text>
        </View>

        {/* Connected Systems */}
        <Text style={s.settingsSection}>CONNECTED SYSTEMS</Text>
        <View style={s.settingsCard}>
          <View style={s.deviceRow}>
            <View style={[s.deviceIcon, { backgroundColor: 'rgba(187,144,30,0.1)' }]}>
              <Ionicons name="home" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.deviceName}>G-Lock Home (Front Door)</Text>
              <Text style={s.deviceStatus}>ESP32-S3 · Facial Recognition Lock</Text>
            </View>
            <View style={[s.onlineDot, { backgroundColor: GREEN }]} />
          </View>
          <View style={s.deviceRow}>
            <View style={[s.deviceIcon, { backgroundColor: 'rgba(187,144,30,0.1)' }]}>
              <Ionicons name="bicycle" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.deviceName}>G-Lock Ride (E-Bike)</Text>
              <Text style={s.deviceStatus}>Brain + Muscle · BLE Immobilizer</Text>
            </View>
            <View style={[s.onlineDot, { backgroundColor: GREEN }]} />
          </View>
        </View>

        {/* Preferences */}
        <Text style={s.settingsSection}>PREFERENCES</Text>
        <View style={s.settingsCard}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Push Notifications</Text>
              <Text style={s.toggleSub}>Get alerts for all security events</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#333', true: GOLD }} thumbColor={notifications ? '#fff' : '#666'} />
          </View>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Auto-Arm on Disconnect</Text>
              <Text style={s.toggleSub}>Arm Ride when head unit disconnects</Text>
            </View>
            <Switch value={autoArm} onValueChange={setAutoArm} trackColor={{ false: '#333', true: GOLD }} thumbColor={autoArm ? '#fff' : '#666'} />
          </View>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>GPS Tracking (Ride)</Text>
              <Text style={s.toggleSub}>Track location when Ride is armed</Text>
            </View>
            <Switch value={gpsTrack} onValueChange={setGpsTrack} trackColor={{ false: '#333', true: GOLD }} thumbColor={gpsTrack ? '#fff' : '#666'} />
          </View>
        </View>

        {/* About */}
        <Text style={s.settingsSection}>ABOUT</Text>
        <View style={s.settingsCard}>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Version</Text>
            <Text style={s.aboutValue}>1.2.0</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Patent</Text>
            <Text style={s.aboutValue}>UK IPO 2613849.5</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Inventors</Text>
            <Text style={s.aboutValue}>Shane &amp; Alexis Goldsmith</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Company</Text>
            <Text style={s.aboutValue}>Goldsmith &amp; Co Ltd, Gibraltar</Text>
          </View>
        </View>

        <Text style={s.footerText}>Part of Goldsmith &amp; Company Limited, Gibraltar</Text>
        <Text style={s.footerText}>The Goldsmith Group of Companies</Text>
        <Text style={s.footerText}>Registered in Gibraltar</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ APP ============
export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: DARKER,
            borderTopColor: BORDER,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: GOLD,
          tabBarInactiveTintColor: MUTED,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Faces"
          component={FacesScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Activity"
          component={ActivityScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="list" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ============ STYLES ============
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },
  scrollContent: { padding: 20 },

  // Header
  header: { marginBottom: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoBadge: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center',
  },
  logoBadgeText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: -1 },
  appTitle: { color: WHITE, fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  appSubtitle: { color: GOLD, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' },
  patentBadge: {
    color: MUTED, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
    marginTop: 4,
  },

  // System Selector
  selectorLabel: { color: MUTED, fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 10 },
  systemSelector: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  systemTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  systemTabActive: {
    backgroundColor: GOLD, borderColor: GOLD,
  },
  systemTabName: { color: MUTED, fontSize: 13, fontWeight: '700' },
  systemTabNameActive: { color: '#000' },
  systemTabSub: { color: '#555', fontSize: 10 },
  systemTabSubActive: { color: 'rgba(0,0,0,0.6)' },

  // Status Card
  statusCard: {
    borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 24,
    borderWidth: 1, overflow: 'hidden',
  },
  statusArmed: { backgroundColor: CARD, borderColor: 'rgba(39,174,96,0.3)' },
  statusDisarmed: { backgroundColor: CARD, borderColor: BORDER },
  statusIconWrap: { marginBottom: 16 },
  statusLabel: { color: MUTED, fontSize: 11, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  statusValue: { fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  statusSub: { color: MUTED, fontSize: 13, marginBottom: 24 },
  armBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, gap: 8,
    minWidth: 200,
  },
  armBtnActive: { backgroundColor: GOLD },
  disarmBtn: { backgroundColor: 'rgba(192,57,43,0.2)', borderWidth: 1, borderColor: RED },
  armBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  statNum: { color: WHITE, fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  statLabel: { color: MUTED, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  // Section
  sectionTitle: { color: GOLD, fontSize: 12, letterSpacing: 3, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },

  // System Cards
  systemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  systemCardIcon: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  systemCardName: { color: WHITE, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  systemCardSub: { color: MUTED, fontSize: 12, marginBottom: 6 },
  systemStatusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  systemStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  systemCardBtn: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  systemCardBtnArm: { backgroundColor: GOLD },
  systemCardBtnDisarm: { backgroundColor: 'rgba(192,57,43,0.2)', borderWidth: 1, borderColor: RED },

  // Events
  eventCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: CARD, borderRadius: 10, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  eventDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  eventType: { color: WHITE, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  eventDetail: { color: MUTED, fontSize: 12, marginBottom: 2 },
  eventMeta: { color: '#555', fontSize: 11, marginBottom: 2 },
  eventTime: { color: '#444', fontSize: 10 },

  // Page Header
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  pageTitle: { color: WHITE, fontSize: 22, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GOLD, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
  },
  addBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { color: WHITE, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  emptySub: { color: MUTED, fontSize: 13, textAlign: 'center' },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center', marginTop: 20 },

  // Faces
  faceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  faceAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(187,144,30,0.1)',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  faceImage: { width: 56, height: 56, borderRadius: 28 },
  faceName: { color: WHITE, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  faceRole: { color: GOLD, fontSize: 12, marginBottom: 2 },
  faceStatus: { color: MUTED, fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // Filter
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  filterTabActive: { backgroundColor: GOLD, borderColor: GOLD },
  filterText: { color: MUTED, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  filterTextActive: { color: '#000' },

  // Settings
  settingsSection: { color: GOLD, fontSize: 11, letterSpacing: 3, fontWeight: '700', marginBottom: 10, marginTop: 20, textTransform: 'uppercase' },
  settingsCard: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  deviceIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  deviceName: { color: WHITE, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  deviceStatus: { color: MUTED, fontSize: 12 },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  toggleLabel: { color: WHITE, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  toggleSub: { color: MUTED, fontSize: 11 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  aboutLabel: { color: MUTED, fontSize: 13 },
  aboutValue: { color: WHITE, fontSize: 13, fontWeight: '600' },
  footerText: { color: '#444', fontSize: 10, textAlign: 'center', marginTop: 4 },
});

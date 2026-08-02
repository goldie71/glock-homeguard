import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator, Alert, Switch, Linking, TextInput, Share, Modal } from 'react-native';
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
const ENTITY_ORDERS = API_BASE + '/entities/ShopOrder';
const ENTITY_COMPETITION = API_BASE + '/entities/CompetitionEntry';
const ENTITY_REFERRALS = API_BASE + '/entities/Referral';

const Tab = createBottomTabNavigator();

// System types
var SYSTEMS = [
  { id: 'home', name: 'G-Lock Home', sub: 'Front Door', icon: 'home-outline', activeIcon: 'home', color: GOLD },
  { id: 'ride', name: 'G-Lock Ride', sub: 'E-Bike / Motorbike', icon: 'bicycle-outline', activeIcon: 'bicycle', color: GOLD },
];

// G-Lock Value Props
var VALUE_PROPS = [
  { icon: 'shield-checkmark', title: 'Zero Cloud', desc: 'Your biometric data never leaves your device' },
  { icon: 'key-off', title: 'No Keys Needed', desc: 'Your face is the only key you need' },
  { icon: 'hardware-chip', title: 'On-Device AI', desc: 'ESP32-S3 processes everything locally' },
  { icon: 'shield', title: 'Patent Protected', desc: 'UK IPO No. 2613849.5' },
];

// Shop Products
var SHOP_PRODUCTS = [
  { id: 'ride', name: 'G-Lock Ride', sub: 'E-Bike Security System', price: 199, wasPrice: 299, icon: 'bicycle', url: 'https://glock-ride.com', badge: 'Pre-Order', desc: 'Dual-unit facial recognition e-bike security. Handlebar Brain + Battery Muscle. BLE immobilizer, GPS tracking, 4G alerts.' },
  { id: 'home', name: 'G-Lock HomeGuard', sub: 'Front Door Access Control', price: 249, wasPrice: 329, icon: 'home', url: 'https://g-lock.co.uk', badge: 'Pre-Order', desc: 'Biometric front door lock. On-device facial recognition, real-time alerts, no cloud required.' },
  { id: 'cabinet', name: 'GlockLock', sub: 'Gun Cabinet Biometric Lock', price: 249, wasPrice: 299, icon: 'lock-closed', url: 'https://glocklock.co.uk', badge: 'Pre-Order', desc: 'Facial recognition access control for firearm storage. No cloud, no compromise. Compatible with most cabinets.' },
  { id: 'bespoke', name: 'Bespoke Build', sub: 'Custom Voltage Integration', price: 0, wasPrice: 0, icon: 'build', url: 'https://g-lock.co.uk', badge: 'POA', desc: 'Custom G-Lock unit built for your specific voltage setup. 72V step-down integration, custom casing, one-off production.' },
  { id: 'replacement', name: 'Replacement Head Unit', sub: 'Spare / Replacement', price: 99, wasPrice: 0, icon: 'hardware-chip', url: 'https://g-lock.co.uk', badge: 'Accessory', desc: 'Replacement handlebar Brain unit. ESP32-S3 + OLED + camera. For existing G-Lock Ride owners.' },
  { id: 'sim', name: 'GiffGaff SIM (12 months)', sub: '4G/LTE Connectivity', price: 15, wasPrice: 0, icon: 'cellular', url: 'https://g-lock.co.uk', badge: 'Accessory', desc: 'Pre-loaded GiffGaff PAYG SIM for 12 months of 4G alerts and GPS tracking. Auto-renewal available.' },
];

var OWNER_DISCOUNT = 0.10;
var REFERRAL_DISCOUNT = 0.15;
var REFERRAL_REWARD = 25;

// ============ DASHBOARD SCREEN ============
function DashboardScreen({ navigation }) {
  var state = useState('home');
  var activeSystem = state[0];
  var setActiveSystem = state[1];
  var armedState = useState({ home: false, ride: false });
  var armed = armedState[0];
  var setArmed = armedState[1];
  var facesState = useState([]);
  var faces = facesState[0];
  var setFaces = facesState[1];
  var eventsState = useState([]);
  var events = eventsState[0];
  var setEvents = eventsState[1];
  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];
  var winnerState = useState(null);
  var winner = winnerState[0];
  var setWinner = winnerState[1];

  var loadData = useCallback(async function() {
    try {
      var results = await Promise.all([
        fetch(ENTITY_FACES + '?limit=100').then(function(r) { return r.json(); }),
        fetch(ENTITY_EVENTS + '?limit=10&sort=-created_date').then(function(r) { return r.json(); }),
        fetch(ENTITY_COMPETITION + '?limit=1&filter=is_winner:true&sort=-created_date').then(function(r) { return r.json(); }).catch(function() { return { data: [] }; }),
      ]);
      setFaces(results[0].data || results[0] || []);
      setEvents(results[1].data || results[1] || []);
      var winData = results[2].data || results[2] || [];
      setWinner(winData.length > 0 ? winData[0] : null);
    } catch (e) {
      // offline mode
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function() { loadData(); }, [loadData]);

  function toggleArm() {
    setArmed(function(prev) { var n = {}; n[activeSystem] = !prev[activeSystem]; return Object.assign({}, prev, n); });
    var systemName = activeSystem === 'home' ? 'G-Lock Home' : 'G-Lock Ride';
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
    }).catch(function() {});
  }

  var currentSystem = SYSTEMS.find(function(s) { return s.id === activeSystem; });
  var isArmed = armed[activeSystem];

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

        {/* Ride of the Month Competition Winner */}
        {winner ? (
          <View style={s.winnerCard}>
            <View style={s.winnerBadge}>
              <Ionicons name="trophy" size={14} color="#000" />
              <Text style={s.winnerBadgeText}>RIDE OF THE MONTH</Text>
            </View>
            <View style={s.winnerContent}>
              {winner.bike_photo_url ? (
                <Image source={{ uri: winner.bike_photo_url }} style={s.winnerPhoto} />
              ) : (
                <View style={s.winnerPhotoPlaceholder}>
                  <Ionicons name="bicycle" size={32} color={GOLD} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.winnerName}>{winner.rider_name || 'G-Lock Rider'}</Text>
                <Text style={s.winnerDesc}>{winner.description || 'Showcase build'}</Text>
                {winner.instagram_handle ? (
                  <Text style={s.winnerInsta}>@{winner.instagram_handle}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={s.winnerVoteBtn}
              onPress={function() { navigation.navigate('Shop'); }}
            >
              <Text style={s.winnerVoteText}>Enter This Month</Text>
            </TouchableOpacity>
          </View>
        ) : !loading ? (
          <TouchableOpacity
            style={s.competitionCTA}
            onPress={function() { navigation.navigate('Shop'); }}
          >
            <Ionicons name="trophy" size={24} color={GOLD} />
            <View style={{ flex: 1 }}>
              <Text style={s.competitionCTATitle}>Ride of the Month</Text>
              <Text style={s.competitionCTASub}>Show off your G-Lock build & win prizes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </TouchableOpacity>
        ) : null}

        {/* System Selector */}
        <Text style={s.selectorLabel}>SELECT SYSTEM</Text>
        <View style={s.systemSelector}>
          {SYSTEMS.map(function(sys) {
            return (
              <TouchableOpacity
                key={sys.id}
                style={[s.systemTab, activeSystem === sys.id && s.systemTabActive]}
                onPress={function() { setActiveSystem(sys.id); }}
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
            );
          })}
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

        {/* G-Lock Value Props */}
        <Text style={s.sectionTitle}>Why G-Lock</Text>
        <View style={s.valueGrid}>
          {VALUE_PROPS.map(function(vp, i) {
            return (
              <View key={i} style={s.valueCard}>
                <View style={s.valueIcon}>
                  <Ionicons name={vp.icon} size={22} color={GOLD} />
                </View>
                <Text style={s.valueTitle}>{vp.title}</Text>
                <Text style={s.valueDesc}>{vp.desc}</Text>
              </View>
            );
          })}
        </View>

        {/* System Info Cards */}
        <Text style={s.sectionTitle}>Your Systems</Text>
        {SYSTEMS.map(function(sys) {
          var sysArmed = armed[sys.id];
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
                onPress={function() {
                  setActiveSystem(sys.id);
                  setTimeout(function() {
                    setArmed(function(prev) { var n = {}; n[sys.id] = !prev[sys.id]; return Object.assign({}, prev, n); });
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
                    }).catch(function() {});
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
          events.slice(0, 5).map(function(evt, i) {
            return (
              <View key={i} style={s.eventCard}>
                <View style={[s.eventDot, { backgroundColor: (evt.event_type || '').toUpperCase() === 'ARM' ? GREEN : (evt.event_type || '').toUpperCase() === 'ALERT' ? RED : GOLD }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.eventType}>{evt.event_type || 'EVENT'}</Text>
                  <Text style={s.eventDetail}>{evt.action_taken || evt.person_identified || 'System activity'}</Text>
                  <Text style={s.eventTime}>{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : ''}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ SHOP SCREEN ============
function ShopScreen() {
  var referralCodeState = useState('GLOCK-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  var referralCode = referralCodeState[0];
  var modalState = useState(null);
  var selectedProduct = modalState[0];
  var setSelectedProduct = modalState[1];
  var orderSuccessState = useState(false);
  var orderSuccess = orderSuccessState[0];
  var setOrderSuccess = orderSuccessState[1];

  function formatPrice(price) {
    if (price === 0) return 'POA';
    return '\u00A3' + price.toFixed(0);
  }

  function getOwnerPrice(product) {
    if (product.price === 0) return 'POA';
    var discounted = product.price - (product.price * OWNER_DISCOUNT);
    return '\u00A3' + discounted.toFixed(0);
  }

  function handleBuy(product) {
    setSelectedProduct(product);
    setOrderSuccess(false);
  }

  function placeOrder(product, email, refCode) {
    var discountedPrice = product.price;
    var discountLabel = 'None';
    if (refCode && refCode.length > 5) {
      discountedPrice = product.price - (product.price * REFERRAL_DISCOUNT);
      discountLabel = 'Referral 15%';
    } else {
      discountedPrice = product.price - (product.price * OWNER_DISCOUNT);
      discountLabel = 'Owner 10%';
    }

    fetch(ENTITY_ORDERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        total_price: discountedPrice,
        discount_applied: discountLabel,
        customer_email: email,
        referral_code: refCode || '',
        status: 'pending',
        quantity: 1,
        order_date: new Date().toISOString()
      })
    }).then(function() {
      setOrderSuccess(true);
    }).catch(function() {
      Alert.alert('Connection Error', 'Could not place order. Please try again later.');
    });
  }

  function shareReferral() {
    Share.share({
      message: 'Get 15% off G-Lock - the facial recognition security system for your e-bike. Use my referral code: ' + referralCode + ' at g-lock.co.uk',
      title: 'G-Lock Referral'
    }).catch(function() {});
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>G-Lock Shop</Text>
        </View>

        {/* Owner Discount Banner */}
        <View style={s.discountBanner}>
          <Ionicons name="pricetag" size={20} color="#000" />
          <Text style={s.discountBannerText}>10% OFF for existing G-Lock owners</Text>
        </View>

        {/* Products */}
        <Text style={s.sectionTitle}>Products</Text>
        {SHOP_PRODUCTS.map(function(prod) {
          return (
            <View key={prod.id} style={s.shopProductCard}>
              <View style={s.shopProductHeader}>
                <View style={[s.shopIcon, { backgroundColor: 'rgba(187,144,30,0.1)' }]}>
                  <Ionicons name={prod.icon} size={28} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.shopNameRow}>
                    <Text style={s.shopName}>{prod.name}</Text>
                    {prod.badge ? (
                      <View style={s.shopBadge}><Text style={s.shopBadgeText}>{prod.badge}</Text></View>
                    ) : null}
                  </View>
                  <Text style={s.shopSub}>{prod.sub}</Text>
                </View>
              </View>
              <Text style={s.shopDesc}>{prod.desc}</Text>
              <View style={s.shopPriceRow}>
                <View>
                  {prod.wasPrice > 0 ? (
                    <Text style={s.shopWasPrice}>{formatPrice(prod.wasPrice)}</Text>
                  ) : null}
                  <Text style={s.shopPrice}>{formatPrice(prod.price)}</Text>
                  {prod.price > 0 ? (
                    <Text style={s.shopOwnerPrice}>Owner: {getOwnerPrice(prod)}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={s.shopBuyBtn}
                  onPress={function() { handleBuy(prod); }}
                >
                  <Ionicons name={prod.price === 0 ? 'mail' : 'cart'} size={18} color="#000" />
                  <Text style={s.shopBuyBtnText}>{prod.price === 0 ? 'ENQUIRE' : 'ORDER NOW'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Refer a Friend */}
        <Text style={s.sectionTitle}>Refer a Friend</Text>
        <View style={s.referralCard}>
          <View style={s.referralIcon}>
            <Ionicons name="gift" size={32} color={GOLD} />
          </View>
          <Text style={s.referralTitle}>Give 15% Off, Get {'\u00A3'}25 Credit</Text>
          <Text style={s.referralDesc}>
            Share your code with friends. They get 15% off their first G-Lock purchase. You get {'\u00A3'}25 store credit when they order.
          </Text>
          <View style={s.referralCodeBox}>
            <Text style={s.referralCodeLabel}>YOUR REFERRAL CODE</Text>
            <Text style={s.referralCode}>{referralCode}</Text>
          </View>
          <TouchableOpacity style={s.referralShareBtn} onPress={shareReferral}>
            <Ionicons name="share-social" size={18} color="#000" />
            <Text style={s.referralShareBtnText}>Share Code</Text>
          </TouchableOpacity>
        </View>

        {/* Ride of the Month Competition */}
        <Text style={s.sectionTitle}>Ride of the Month</Text>
        <View style={s.competitionCard}>
          <View style={s.competitionHeader}>
            <Ionicons name="trophy" size={28} color={GOLD} />
            <Text style={s.competitionTitle}>Show Off Your Build</Text>
          </View>
          <Text style={s.competitionDesc}>
            Submit a photo of your G-Lock secured ride. The winner gets featured on the app front page, {'\u00A3'}50 store credit, and a custom G-Lock merchandise pack.
          </Text>
          <Text style={s.competitionPrizes}>Prizes:</Text>
          <Text style={s.competitionPrizeItem}>{'  \u2022  1st: Front page feature + \u00A350 credit'}</Text>
          <Text style={s.competitionPrizeItem}>{'  \u2022  2nd: \u00A325 store credit'}</Text>
          <Text style={s.competitionPrizeItem}>{'  \u2022  3rd: \u00A310 store credit'}</Text>
          <TouchableOpacity
            style={s.competitionEnterBtn}
            onPress={function() {
              Alert.alert(
                'Enter Competition',
                'Send your name, Instagram handle, and a photo of your G-Lock ride to: shane@g-lock.co.uk',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="camera" size={18} color="#000" />
            <Text style={s.competitionEnterBtnText}>Enter Competition</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footerText}>Part of Goldsmith &amp; Company Limited, Gibraltar</Text>
        <Text style={s.footerText}>The Goldsmith Group of Companies</Text>
        <Text style={s.footerText}>Registered in Gibraltar · All prices exclude UK VAT</Text>
      </ScrollView>

      {/* Order Modal */}
      <Modal
        visible={selectedProduct !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={function() { setSelectedProduct(null); }}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {orderSuccess ? (
              <View style={s.orderSuccessWrap}>
                <Ionicons name="checkmark-circle" size={64} color={GREEN} />
                <Text style={s.orderSuccessTitle}>Order Placed!</Text>
                <Text style={s.orderSuccessDesc}>
                  We'll be in touch shortly to confirm your order and arrange payment.
                </Text>
                <TouchableOpacity
                  style={s.modalCloseBtn}
                  onPress={function() { setSelectedProduct(null); setOrderSuccess(false); }}
                >
                  <Text style={s.modalCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : selectedProduct ? (
              <View>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>{selectedProduct.name}</Text>
                  <TouchableOpacity onPress={function() { setSelectedProduct(null); }}>
                    <Ionicons name="close" size={24} color={MUTED} />
                  </TouchableOpacity>
                </View>
                <Text style={s.modalPrice}>{formatPrice(selectedProduct.price)}</Text>
                {selectedProduct.price > 0 ? (
                  <Text style={s.modalOwnerPrice}>Owner price: {getOwnerPrice(selectedProduct)} (10% off)</Text>
                ) : null}
                <Text style={s.modalDesc}>{selectedProduct.desc}</Text>

                <Text style={s.modalLabel}>Email Address</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#555"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={s.modalLabel}>Referral Code (optional)</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="GLOCK-XXXXXX"
                  placeholderTextColor="#555"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={s.modalOrderBtn}
                  onPress={function() {
                    placeOrder(selectedProduct, 'customer@g-lock.co.uk', '');
                  }}
                >
                  <Text style={s.modalOrderBtnText}>
                    {selectedProduct.price === 0 ? 'Send Enquiry' : 'Place Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============ FACES SCREEN ============
function FacesScreen() {
  var facesState = useState([]);
  var faces = facesState[0];
  var setFaces = facesState[1];
  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var loadFaces = useCallback(async function() {
    try {
      var res = await fetch(ENTITY_FACES + '?limit=100');
      var data = await res.json();
      setFaces(data.data || data || []);
    } catch (e) {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function() { loadFaces(); }, [loadFaces]);

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
          keyExtractor={function(item, i) { return item.id || i.toString(); }}
          contentContainerStyle={{ padding: 20 }}
          renderItem={function(_ref) {
            var item = _ref.item;
            return (
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
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ============ ACTIVITY SCREEN ============
function ActivityScreen() {
  var eventsState = useState([]);
  var events = eventsState[0];
  var setEvents = eventsState[1];
  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];
  var filterState = useState('all');
  var filter = filterState[0];
  var setFilter = filterState[1];

  var loadEvents = useCallback(async function() {
    try {
      var res = await fetch(ENTITY_EVENTS + '?limit=50&sort=-created_date');
      var data = await res.json();
      setEvents(data.data || data || []);
    } catch (e) {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function() { loadEvents(); }, [loadEvents]);

  var filtered = events.filter(function(evt) {
    if (filter === 'all') return true;
    if (filter === 'arm') return (evt.event_type || '').toUpperCase() === 'ARM' || (evt.event_type || '').toUpperCase() === 'DISARM';
    if (filter === 'alert') return (evt.event_type || '').toUpperCase() === 'ALERT' || (evt.event_type || '').toUpperCase() === 'INTRUSION';
    return true;
  });

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Activity Log</Text>
      </View>

      <View style={s.filterRow}>
        <TouchableOpacity style={[s.filterTab, filter === 'all' && s.filterTabActive]} onPress={function() { setFilter('all'); }}>
          <Text style={[s.filterText, filter === 'all' && s.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.filterTab, filter === 'arm' && s.filterTabActive]} onPress={function() { setFilter('arm'); }}>
          <Text style={[s.filterText, filter === 'arm' && s.filterTextActive]}>Arm/Disarm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.filterTab, filter === 'alert' && s.filterTabActive]} onPress={function() { setFilter('alert'); }}>
          <Text style={[s.filterText, filter === 'alert' && s.filterTextActive]}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={GOLD} size="large" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="list-outline" size={64} color={BORDER} />
          <Text style={s.emptyTitle}>No Activity</Text>
          <Text style={s.emptySub}>Security events will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={function(item, i) { return item.id || i.toString(); }}
          contentContainerStyle={{ padding: 20 }}
          renderItem={function(_ref) {
            var evt = _ref.item;
            return (
              <View style={s.eventCard}>
                <View style={[s.eventDot, { backgroundColor: (evt.event_type || '').toUpperCase() === 'ARM' ? GREEN : (evt.event_type || '').toUpperCase() === 'ALERT' ? RED : GOLD }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.eventType}>{evt.event_type || 'EVENT'}</Text>
                  <Text style={s.eventDetail}>{evt.action_taken || evt.person_identified || 'System activity'}</Text>
                  <Text style={s.eventMeta}>Camera: {evt.camera_source || 'Unknown'}</Text>
                  <Text style={s.eventTime}>{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : ''}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ============ SETTINGS SCREEN ============
function SettingsScreen() {
  var notifState = useState(true);
  var notifications = notifState[0];
  var setNotifications = notifState[1];
  var autoArmState = useState(false);
  var autoArm = autoArmState[0];
  var setAutoArm = autoArmState[1];
  var gpsState = useState(true);
  var gpsTrack = gpsState[0];
  var setGpsTrack = gpsState[1];

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Settings</Text>
        </View>

        {/* Code-G Banner */}
        <View style={s.codeGBanner}>
          <View style={s.codeGLogoRow}>
            <View style={s.codeGBadge}>
              <Text style={s.codeGBadgeText}>CG</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.codeGName}>Code-G</Text>
              <Text style={s.codeGSub}>Powered by G-Lock</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={GOLD} />
          </View>
          <Text style={s.codeGDesc}>
            Code-G is powered by G-Lock technology — biometric access control, IoT security, and connected device management. Visit codegid.com
          </Text>
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
            <Text style={s.aboutLabel}>App Version</Text>
            <Text style={s.aboutValue}>1.4.0</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Platform</Text>
            <Text style={s.aboutValue}>Code-G · codegid.com</Text>
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
        <Text style={s.footerText}>Registered in Gibraltar · All prices exclude UK VAT</Text>
        <Text style={[s.footerText, { color: GOLD, marginTop: 12 }]}>Powered by G-Lock</Text>
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
            tabBarIcon: function(_ref) { var color = _ref.color; return <Ionicons name="home" size={22} color={color} />; },
          }}
        />
        <Tab.Screen
          name="Shop"
          component={ShopScreen}
          options={{
            tabBarIcon: function(_ref) { var color = _ref.color; return <Ionicons name="cart" size={22} color={color} />; },
          }}
        />
        <Tab.Screen
          name="Faces"
          component={FacesScreen}
          options={{
            tabBarIcon: function(_ref) { var color = _ref.color; return <Ionicons name="people" size={22} color={color} />; },
          }}
        />
        <Tab.Screen
          name="Activity"
          component={ActivityScreen}
          options={{
            tabBarIcon: function(_ref) { var color = _ref.color; return <Ionicons name="list" size={22} color={color} />; },
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: function(_ref) { var color = _ref.color; return <Ionicons name="settings" size={22} color={color} />; },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ============ STYLES ============
var s = StyleSheet.create({
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

  // Competition Winner
  winnerCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(187,144,30,0.4)',
  },
  winnerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  winnerBadgeText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  winnerContent: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 14 },
  winnerPhoto: { width: 72, height: 72, borderRadius: 12 },
  winnerPhotoPlaceholder: {
    width: 72, height: 72, borderRadius: 12, backgroundColor: 'rgba(187,144,30,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  winnerName: { color: WHITE, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  winnerDesc: { color: MUTED, fontSize: 12, marginBottom: 2 },
  winnerInsta: { color: GOLD, fontSize: 12, fontWeight: '600' },
  winnerVoteBtn: {
    backgroundColor: 'rgba(187,144,30,0.15)', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  winnerVoteText: { color: GOLD, fontSize: 13, fontWeight: '700' },

  // Competition CTA
  competitionCTA: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: BORDER,
  },
  competitionCTATitle: { color: WHITE, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  competitionCTASub: { color: MUTED, fontSize: 12 },

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

  // Value Props
  valueGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24,
  },
  valueCard: {
    width: '48%', flexGrow: 1, backgroundColor: CARD, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: BORDER,
  },
  valueIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(187,144,30,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  valueTitle: { color: WHITE, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  valueDesc: { color: MUTED, fontSize: 11, lineHeight: 15 },

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

  // Code-G Banner
  codeGBanner: {
    backgroundColor: CARD, borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(187,144,30,0.3)',
  },
  codeGLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  codeGBadge: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  codeGBadgeText: { color: GOLD, fontWeight: '900', fontSize: 14, letterSpacing: -1 },
  codeGName: { color: WHITE, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  codeGSub: { color: GOLD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  codeGDesc: { color: MUTED, fontSize: 12, lineHeight: 18 },

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

  // Shop
  discountBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16,
    marginBottom: 20,
  },
  discountBannerText: { color: '#000', fontSize: 13, fontWeight: '700' },

  shopProductCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  shopProductHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  shopIcon: {
    width: 52, height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  shopName: { color: WHITE, fontSize: 16, fontWeight: '700', flex: 1 },
  shopBadge: {
    backgroundColor: 'rgba(187,144,30,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  shopBadgeText: { color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  shopSub: { color: MUTED, fontSize: 12 },
  shopDesc: { color: '#666', fontSize: 12, lineHeight: 17, marginBottom: 12 },
  shopPriceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER,
  },
  shopWasPrice: {
    color: '#555', fontSize: 12, textDecorationLine: 'line-through',
  },
  shopPrice: { color: GOLD, fontSize: 22, fontWeight: '800' },
  shopOwnerPrice: { color: GREEN, fontSize: 11, fontWeight: '600', marginTop: 2 },
  shopBuyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GOLD, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10,
  },
  shopBuyBtnText: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  // Referral
  referralCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 24, marginBottom: 20,
    borderWidth: 1, borderColor: BORDER, alignItems: 'center',
  },
  referralIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(187,144,30,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  referralTitle: { color: WHITE, fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  referralDesc: { color: MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  referralCodeBox: {
    backgroundColor: DARKER, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24,
    borderWidth: 1, borderColor: BORDER, marginBottom: 14, width: '100%',
    alignItems: 'center',
  },
  referralCodeLabel: { color: MUTED, fontSize: 9, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  referralCode: { color: GOLD, fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  referralShareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GOLD, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10,
  },
  referralShareBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },

  // Competition
  competitionCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: BORDER,
  },
  competitionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  competitionTitle: { color: WHITE, fontSize: 18, fontWeight: '700' },
  competitionDesc: { color: MUTED, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  competitionPrizes: { color: GOLD, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  competitionPrizeItem: { color: MUTED, fontSize: 12, marginBottom: 2 },
  competitionEnterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GOLD, paddingVertical: 14, borderRadius: 10, marginTop: 14,
  },
  competitionEnterBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: CARD, borderRadius: 20, padding: 24, width: '100%',
    maxWidth: 380, borderWidth: 1, borderColor: BORDER,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: WHITE, fontSize: 20, fontWeight: '800' },
  modalPrice: { color: GOLD, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  modalOwnerPrice: { color: GREEN, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  modalDesc: { color: MUTED, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  modalLabel: { color: MUTED, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  modalInput: {
    backgroundColor: DARKER, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14,
    color: WHITE, fontSize: 14, marginBottom: 14, borderWidth: 1, borderColor: BORDER,
  },
  modalOrderBtn: {
    backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  modalOrderBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  modalCloseBtn: {
    backgroundColor: 'rgba(187,144,30,0.2)', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginTop: 12,
  },
  modalCloseBtnText: { color: GOLD, fontSize: 14, fontWeight: '700' },

  // Order Success
  orderSuccessWrap: { alignItems: 'center', paddingVertical: 20 },
  orderSuccessTitle: { color: WHITE, fontSize: 22, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  orderSuccessDesc: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 16 },

  // Legacy shop styles
  shopCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GOLD, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
  },
  shopBtnText: { color: '#000', fontSize: 12, fontWeight: '700' },
});

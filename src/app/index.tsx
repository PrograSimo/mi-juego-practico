import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';

const opciones = ['Piedra 🪨', 'Papel 📄', 'Tijera ✂️'];

// ⚠️ NOTA: Si pruebas en un emulador Android usa 'http://10.0.2.2:3000'. 
// Si pruebas en un teléfono físico por Wi-Fi, pon la IP local de tu PC (ej: 'http://192.168.1.15:3000')
const SOCKET_URL = 'http://192.168.1.101:3000';

export default function GameScreen() {
  const [modo, setModo] = useState<'menu' | 'maquina' | 'dosJugadores' | 'multijugador'>('menu');
  
  // Estados para modo Máquina
  const [eleccionUsuario, setEleccionUsuario] = useState('');
  const [eleccionMaquina, setEleccionMaquina] = useState('');
  const [resultadoMaquina, setResultadoMaquina] = useState('¡Elige una opción!');

  // Estados para modo 2 Jugadores (Mismo Dispositivo)
  const [turnoJugador, setTurnoJugador] = useState<1 | 2>(1);
  const [jugadaJ1, setJugadaJ1] = useState('');
  const [resultado2P, setResultado2P] = useState('Turno del Jugador 1 (Elige en secreto)');

  // Estados para Multijugador en Red (Sockets)
  const [socket, setSocket] = useState<Socket | null>(null);
  const [codigoSala, setCodigoSala] = useState('');
  const [enSala, setEnSala] = useState(false);
  const [resultadoRed, setResultadoRed] = useState('Esperando rival...');
  const [tuJugadaRed, setTuJugadaRed] = useState('');
  const [rivalJugadaRed, setRivalJugadaRed] = useState('');

  // Configurar conexión de red al entrar al modo multijugador
  useEffect(() => {
    if (modo === 'multijugador') {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('unidoExitosamente', (data) => {
        setEnSala(true);
        Alert.alert('Conectado', data.mensaje);
      });

      newSocket.on('resultadoPartida', (data) => {
        setTuJugadaRed(data.tuJugada);
        setRivalJugadaRed(data.rivalJugada);
        setResultadoRed(data.resultado);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [modo]);

  const unirseALaSala = () => {
    if (!codigoSala) {
      Alert.alert('Error', 'Por favor ingresa un código de sala');
      return;
    }
    socket?.emit('unirseSala', { codigoSala });
  };

  const hacerJugadaRed = (jugada: string) => {
    setResultadoRed('Esperando al rival...');
    socket?.emit('hacerJugada', { codigoSala, jugada });
  };

  // Lógica contra la Máquina
  const jugarConMaquina = (usuario: string) => {
    setEleccionUsuario(usuario);
    const indiceAleatorio = Math.floor(Math.random() * 3);
    const maquina = opciones[indiceAleatorio];
    setEleccionMaquina(maquina);

    if (usuario === maquina) {
      setResultadoMaquina('¡Empate! 🤝');
    } else if (
      (usuario === 'Piedra 🪨' && maquina === 'Tijera ✂️') ||
      (usuario === 'Papel 📄' && maquina === 'Piedra 🪨') ||
      (usuario === 'Tijera ✂️' && maquina === 'Papel 📄')
    ) {
      setResultadoMaquina('¡Ganaste! 🎉');
    } else {
      setResultadoMaquina('¡Perdiste! 🤖');
    }
  };

  // Lógica para 2 Jugadores (Mismo Dispositivo)
  const jugarDosJugadores = (jugada: string) => {
    if (turnoJugador === 1) {
      setJugadaJ1(jugada);
      setTurnoJugador(2);
      setResultado2P('Turno del Jugador 2 (Pásale el teléfono)');
    } else {
      const j1 = jugadaJ1;
      const j2 = jugada;

      if (j1 === j2) {
        setResultado2P(`¡Empate! Ambos eligieron ${j1} 🤝`);
      } else if (
        (j1 === 'Piedra 🪨' && j2 === 'Tijera ✂️') ||
        (j1 === 'Papel 📄' && j2 === 'Piedra 🪨') ||
        (j1 === 'Tijera ✂️' && j2 === 'Papel 📄')
      ) {
        setResultado2P(`¡Jugador 1 Gana! (${j1} vence a ${j2}) 🎉`);
      } else {
        setResultado2P(`¡Jugador 2 Gana! (${j2} vence a ${j1}) 🎉`);
      }
      setTurnoJugador(1);
    }
  };

  // 1. Pantalla del Menú Principal
  if (modo === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.titulo}>Piedra, Papel o Tijera</Text>
        <Text style={styles.subtitulo}>Selecciona el modo de juego:</Text>
        
        <View style={styles.contenedorBotones}>
          <TouchableOpacity style={styles.boton} onPress={() => setModo('maquina')}>
            <Text style={styles.textoBoton}>🤖 Contra la Máquina</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.botonSecundario} onPress={() => setModo('dosJugadores')}>
            <Text style={styles.textoBoton}>👥 Dos Jugadores (Mismo Móvil)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonRed} onPress={() => setModo('multijugador')}>
            <Text style={styles.textoBoton}>🌐 Multijugador en Red</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Pantalla del Modo Máquina
  if (modo === 'maquina') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.titulo}>Modo: Contra la Máquina</Text>
        
        <View style={styles.cajaResultado}>
          <Text style={styles.textoResultado}>{resultadoMaquina}</Text>
          <Text style={styles.detalle}>Tú: {eleccionUsuario || '---'}</Text>
          <Text style={styles.detalle}>Máquina: {eleccionMaquina || '---'}</Text>
        </View>

        <Text style={styles.subtitulo}>Haz tu jugada:</Text>
        <View style={styles.contenedorBotones}>
          {opciones.map((opcion) => (
            <TouchableOpacity key={opcion} style={styles.boton} onPress={() => jugarConMaquina(opcion)}>
              <Text style={styles.textoBoton}>{opcion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.botonVolver} onPress={() => setModo('menu')}>
          <Text style={styles.textoVolver}>← Volver al Menú</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 3. Pantalla del Modo 2 Jugadores (Mismo Dispositivo)
  if (modo === 'dosJugadores') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.titulo}>Modo: Dos Jugadores</Text>
        
        <View style={styles.cajaResultado}>
          <Text style={styles.textoResultado}>{resultado2P}</Text>
          <Text style={styles.detalle}>Jugador en turno: Jugador {turnoJugador}</Text>
        </View>

        <Text style={styles.subtitulo}>Elige tu arma en secreto:</Text>
        <View style={styles.contenedorBotones}>
          {opciones.map((opcion) => (
            <TouchableOpacity key={opcion} style={styles.botonDosP} onPress={() => jugarDosJugadores(opcion)}>
              <Text style={styles.textoBoton}>{opcion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.botonVolver} onPress={() => { setModo('menu'); setTurnoJugador(1); }}>
          <Text style={styles.textoVolver}>← Volver al Menú</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 4. Pantalla del Modo Multijugador en Red (Nuevo)
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Modo: Multijugador Online</Text>

      {!enSala ? (
        <View style={styles.cajaResultado}>
          <Text style={styles.subtitulo}>Ingresa un código para unirte:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: sala123"
            placeholderTextColor="#888"
            value={codigoSala}
            onChangeText={setCodigoSala}
          />
          <TouchableOpacity style={styles.botonRed} onPress={unirseALaSala}>
            <Text style={styles.textoBoton}>Unirse a la Sala</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contenedorCompletoSala}>
          <View style={styles.cajaResultado}>
            <Text style={styles.textoSalaActiva}>Sala: {codigoSala}</Text>
            <Text style={styles.textoResultado}>{resultadoRed}</Text>
            {tuJugadaRed !== '' && <Text style={styles.detalle}>Tu jugada: {tuJugadaRed}</Text>}
            {rivalJugadaRed !== '' && <Text style={styles.detalle}>Jugada del rival: {rivalJugadaRed}</Text>}
          </View>

          <Text style={styles.subtitulo}>Elige tu jugada:</Text>
          <View style={styles.contenedorBotones}>
            {opciones.map((opcion) => (
              <TouchableOpacity key={opcion} style={styles.botonRed} onPress={() => hacerJugadaRed(opcion)}>
                <Text style={styles.textoBoton}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.botonVolver} onPress={() => { setModo('menu'); setEnSala(false); setCodigoSala(''); }}>
        <Text style={styles.textoVolver}>← Volver al Menú</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 20, textAlign: 'center' },
  cajaResultado: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  textoResultado: { fontSize: 18, fontWeight: 'bold', color: '#4ade80', marginBottom: 15, textAlign: 'center' },
  detalle: { fontSize: 16, color: '#d1d5db', marginVertical: 4 },
  subtitulo: { fontSize: 16, color: '#9ca3af', marginBottom: 15, textAlign: 'center' },
  contenedorBotones: { width: '100%', gap: 12 },
  contenedorCompletoSala: { width: '100%', alignItems: 'center' },
  boton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 10, alignItems: 'center' },
  botonSecundario: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 10, alignItems: 'center' },
  botonRed: { backgroundColor: '#f97316', padding: 16, borderRadius: 10, alignItems: 'center' },
  botonDosP: { backgroundColor: '#10b981', padding: 16, borderRadius: 10, alignItems: 'center' },
  textoBoton: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  textoSalaActiva: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { width: '100%', backgroundColor: '#121212', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, textAlign: 'center', fontSize: 16, borderWidth: 1, borderColor: '#444' },
  botonVolver: { marginTop: 20, padding: 10 },
  textoVolver: { color: '#9ca3af', fontSize: 16 }
});
import { network } from '@/config'
import { isWalletEnabled } from '@/utils/wallet'

export const state = () => ({
  warningAccepted: false,
  connected: false
})

export const actions = {
  async connectWallet ({ dispatch }) {
    if (!await isWalletEnabled()) {
      await window.bitcoin.enable()
    }

    const connectedNetwork = await window.bitcoin.request({ method: 'wallet_getConnectedNetwork', params: [] })
    if (network.name === 'testnet' && connectedNetwork.name !== 'bitcoin_testnet') {
      throw new Error('INVALID_NETWORK')
    } else if (network.name === 'mainnet' && connectedNetwork.name !== 'bitcoin') {
      throw new Error('INVALID_NETWORK')
    }

    dispatch('setConnected', { connected: true })
  },
  setConnected ({ commit }, { connected }) {
    commit('setConnected', connected)
  },
  acceptWarning ({ commit }) {
    commit('setWarningAccepted')
  }
}

export const mutations = {
  setConnected (state, connected) {
    state.connected = connected
  },
  setWarningAccepted (state) {
    state.warningAccepted = true
  }
}

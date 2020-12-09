function shortHash (hash) {
  return `${hash.slice(0, 6)}..${hash.slice(-6)}`
}

function addressShort (address) {
  return `${address.slice(0, 3)}${address.slice(3, 7)}..${address.slice(-4)}`
}

function timestampToString (timestamp) {
  const dateObj = new Date(timestamp * 1000)
  return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
}

function explorerLink (hash) {
  return `https://blockstream.info/testnet/${hash}`
}

export { shortHash, addressShort, timestampToString, explorerLink }

// ─────────────────────────────────────────────────────────
// Script: GetCircle.cdc
// Reads a circle by ID from TrustCircleSocial
// ─────────────────────────────────────────────────────────
import TrustCircleSocial from 0xTRUSTCIRCLE_ADDRESS

access(all) fun main(circleId: UInt64): TrustCircleSocial.Circle? {
    return TrustCircleSocial.getCircle(id: circleId)
}

// ─────────────────────────────────────────────────────────
// Script: GetProfile.cdc
// ─────────────────────────────────────────────────────────
// access(all) fun main(address: Address): TrustCircleSocial.UserProfile? {
//     return TrustCircleSocial.getProfile(address: address)
// }

// ─────────────────────────────────────────────────────────
// Script: GetCirclePosts.cdc
// ─────────────────────────────────────────────────────────
// access(all) fun main(circleId: UInt64): [UInt64] {
//     return TrustCircleSocial.getCirclePosts(circleId: circleId)
// }

// ─────────────────────────────────────────────────────────
// Script: CheckMembership.cdc
// ─────────────────────────────────────────────────────────
// access(all) fun main(circleId: UInt64, address: Address): Bool {
//     return TrustCircleSocial.isMember(circleId: circleId, address: address)
// }

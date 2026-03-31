// ─────────────────────────────────────────────────────────
// Transaction: CreateProfile.cdc
// Creates a new TrustCircle user profile on Flow
// ─────────────────────────────────────────────────────────
import TrustCircleSocial from 0xTRUSTCIRCLE_ADDRESS

transaction(handle: String) {
    prepare(signer: auth(Storage) &Account) {}

    execute {
        TrustCircleSocial.createProfile(handle: handle)
        log("Profile created: ".concat(handle))
    }
}

// ─────────────────────────────────────────────────────────
// Transaction: JoinCircle.cdc
// Joins a trust-gated circle with a Zama trust attestation
// ─────────────────────────────────────────────────────────
// import TrustCircleSocial from 0xTRUSTCIRCLE_ADDRESS
//
// transaction(circleId: UInt64, trustAttestation: String) {
//     prepare(signer: auth(Storage) &Account) {}
//
//     execute {
//         TrustCircleSocial.joinCircle(
//             circleId: circleId,
//             trustAttestation: trustAttestation
//         )
//         log("Joined circle: ".concat(circleId.toString()))
//     }
// }

// ─────────────────────────────────────────────────────────
// Transaction: FollowUser.cdc
// Follow another user on TrustCircle
// ─────────────────────────────────────────────────────────
// import TrustCircleSocial from 0xTRUSTCIRCLE_ADDRESS
//
// transaction(target: Address) {
//     prepare(signer: auth(Storage) &Account) {}
//
//     execute {
//         TrustCircleSocial.followUser(target: target)
//         log("Followed: ".concat(target.toString()))
//     }
// }

// ─────────────────────────────────────────────────────────
// Transaction: RegisterPost.cdc
// Registers post metadata on Flow (content on Filecoin, key on Zama)
// ─────────────────────────────────────────────────────────
// import TrustCircleSocial from 0xTRUSTCIRCLE_ADDRESS
//
// transaction(
//     circleId: UInt64,
//     contentCID: String,
//     isEncrypted: Bool,
//     minTrustRequired: UInt32,
//     encryptedKeyRef: String
// ) {
//     prepare(signer: auth(Storage) &Account) {}
//
//     execute {
//         let postId = TrustCircleSocial.registerPost(
//             circleId: circleId,
//             contentCID: contentCID,
//             isEncrypted: isEncrypted,
//             minTrustRequired: minTrustRequired,
//             encryptedKeyRef: encryptedKeyRef
//         )
//         log("Post registered: ".concat(postId.toString()))
//     }
// }

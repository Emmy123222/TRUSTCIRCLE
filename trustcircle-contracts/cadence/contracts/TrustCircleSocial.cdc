// TrustCircleSocial.cdc
// Flow Cadence contract for TrustCircle social graph
// Handles: circles, memberships, following, and post metadata
// Deployed on Flow Testnet

access(all) contract TrustCircleSocial {

    // ─── Events ───────────────────────────────────────────────────
    access(all) event CircleCreated(id: UInt64, name: String, creator: Address, minTrust: UInt32)
    access(all) event MemberJoined(circleId: UInt64, member: Address)
    access(all) event MemberLeft(circleId: UInt64, member: Address)
    access(all) event UserFollowed(follower: Address, following: Address)
    access(all) event UserUnfollowed(follower: Address, unfollowing: Address)
    access(all) event PostMetaRegistered(postId: UInt64, author: Address, circleId: UInt64, contentCID: String)
    access(all) event ProfileCreated(user: Address, handle: String)

    // ─── Structs ──────────────────────────────────────────────────
    access(all) struct Circle {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let creator: Address
        access(all) let minTrustScore: UInt32
        access(all) let category: UInt8
        access(all) let color: String
        access(all) let icon: String
        access(all) var memberCount: UInt64
        access(all) var postCount: UInt64
        access(all) let createdAt: UFix64

        init(
            id: UInt64,
            name: String,
            description: String,
            creator: Address,
            minTrustScore: UInt32,
            category: UInt8,
            color: String,
            icon: String
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.creator = creator
            self.minTrustScore = minTrustScore
            self.category = category
            self.color = color
            self.icon = icon
            self.memberCount = 0
            self.postCount = 0
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    access(all) struct UserProfile {
        access(all) let userAddress: Address
        access(all) let handle: String
        access(all) var followerCount: UInt64
        access(all) var followingCount: UInt64
        access(all) var postCount: UInt64
        access(all) let createdAt: UFix64
        access(all) var trustScoreCID: String

        init(userAddress: Address, handle: String) {
            self.userAddress = userAddress
            self.handle = handle
            self.followerCount = 0
            self.followingCount = 0
            self.postCount = 0
            self.createdAt = getCurrentBlock().timestamp
            self.trustScoreCID = ""
        }
    }

    access(all) struct PostMeta {
        access(all) let id: UInt64
        access(all) let author: Address
        access(all) let circleId: UInt64
        access(all) let contentCID: String
        access(all) let isEncrypted: Bool
        access(all) let minTrustRequired: UInt32
        access(all) let timestamp: UFix64
        access(all) let encryptedKeyRef: String

        init(
            id: UInt64,
            author: Address,
            circleId: UInt64,
            contentCID: String,
            isEncrypted: Bool,
            minTrustRequired: UInt32,
            encryptedKeyRef: String
        ) {
            self.id = id
            self.author = author
            self.circleId = circleId
            self.contentCID = contentCID
            self.isEncrypted = isEncrypted
            self.minTrustRequired = minTrustRequired
            self.timestamp = getCurrentBlock().timestamp
            self.encryptedKeyRef = encryptedKeyRef
        }
    }

    // ─── Contract State ───────────────────────────────────────────
    access(all) var totalCircles: UInt64
    access(all) var totalPosts: UInt64
    access(all) var totalUsers: UInt64

    access(self) var circles: {UInt64: Circle}
    access(self) var memberships: {UInt64: {Address: Bool}}
    access(self) var following: {Address: {Address: Bool}}
    access(self) var profiles: {Address: UserProfile}
    access(self) var postMeta: {UInt64: PostMeta}
    access(self) var userPosts: {Address: [UInt64]}
    access(self) var circlePosts: {UInt64: [UInt64]}

    // ─── Profile ──────────────────────────────────────────────────

    access(all) fun createProfile(caller: Address, handle: String) {
        pre {
            self.profiles[caller] == nil: "Profile already exists"
            handle.length > 0: "Handle cannot be empty"
            handle.length <= 32: "Handle too long"
        }
        let profile = UserProfile(userAddress: caller, handle: handle)
        self.profiles[caller] = profile
        self.userPosts[caller] = []
        self.following[caller] = {}
        self.totalUsers = self.totalUsers + 1
        emit ProfileCreated(user: caller, handle: handle)
    }

    // ─── Circles ──────────────────────────────────────────────────

    access(all) fun createCircle(
        caller: Address,
        name: String,
        description: String,
        minTrustScore: UInt32,
        category: UInt8,
        color: String,
        icon: String
    ): UInt64 {
        pre {
            name.length > 0: "Name cannot be empty"
            name.length <= 64: "Name too long"
            minTrustScore <= 1000: "Trust score max is 1000"
        }
        self.totalCircles = self.totalCircles + 1
        let circleId = self.totalCircles

        let circle = Circle(
            id: circleId,
            name: name,
            description: description,
            creator: caller,
            minTrustScore: minTrustScore,
            category: category,
            color: color,
            icon: icon
        )

        self.circles[circleId] = circle
        self.memberships[circleId] = {}
        self.circlePosts[circleId] = []

        emit CircleCreated(id: circleId, name: name, creator: caller, minTrust: minTrustScore)
        return circleId
    }

    access(all) fun joinCircle(caller: Address, circleId: UInt64, trustAttestation: String) {
        pre {
            self.circles[circleId] != nil: "Circle not found"
            trustAttestation.length > 0: "Missing trust attestation"
        }
        if self.memberships[circleId] == nil {
            self.memberships[circleId] = {}
        }
        let _ = self.memberships[circleId]!.insert(key: caller, true)

        let circle = self.circles[circleId]!
        let updated = Circle(
            id: circle.id,
            name: circle.name,
            description: circle.description,
            creator: circle.creator,
            minTrustScore: circle.minTrustScore,
            category: circle.category,
            color: circle.color,
            icon: circle.icon
        )
        self.circles[circleId] = updated

        emit MemberJoined(circleId: circleId, member: caller)
    }

    access(all) fun leaveCircle(caller: Address, circleId: UInt64) {
        pre {
            self.circles[circleId] != nil: "Circle not found"
            self.memberships[circleId] != nil: "No membership record"
        }
        let _ = self.memberships[circleId]!.remove(key: caller)
        emit MemberLeft(circleId: circleId, member: caller)
    }

    // ─── Social graph ─────────────────────────────────────────────

    access(all) fun followUser(follower: Address, target: Address) {
        pre {
            follower != target: "Cannot follow yourself"
            self.profiles[target] != nil: "Target profile not found"
        }
        if self.following[follower] == nil {
            self.following[follower] = {}
        }
        let _ = self.following[follower]!.insert(key: target, true)
        emit UserFollowed(follower: follower, following: target)
    }

    access(all) fun unfollowUser(follower: Address, target: Address) {
        if let follows = self.following[follower] {
            var mutableFollows = follows
            let _ = mutableFollows.remove(key: target)
            self.following[follower] = mutableFollows
        }
        emit UserUnfollowed(follower: follower, unfollowing: target)
    }

    // ─── Posts ────────────────────────────────────────────────────

    access(all) fun registerPost(
        caller: Address,
        circleId: UInt64,
        contentCID: String,
        isEncrypted: Bool,
        minTrustRequired: UInt32,
        encryptedKeyRef: String
    ): UInt64 {
        pre {
            self.circles[circleId] != nil: "Circle not found"
            contentCID.length > 0: "Empty content CID"
        }

        self.totalPosts = self.totalPosts + 1
        let postId = self.totalPosts

        let meta = PostMeta(
            id: postId,
            author: caller,
            circleId: circleId,
            contentCID: contentCID,
            isEncrypted: isEncrypted,
            minTrustRequired: minTrustRequired,
            encryptedKeyRef: encryptedKeyRef
        )

        self.postMeta[postId] = meta

        if self.userPosts[caller] == nil {
            self.userPosts[caller] = []
        }
        self.userPosts[caller]!.append(postId)

        if self.circlePosts[circleId] == nil {
            self.circlePosts[circleId] = []
        }
        self.circlePosts[circleId]!.append(postId)

        emit PostMetaRegistered(postId: postId, author: caller, circleId: circleId, contentCID: contentCID)
        return postId
    }

    // ─── Getters ──────────────────────────────────────────────────

    access(all) fun getCircle(id: UInt64): Circle? {
        return self.circles[id]
    }

    access(all) fun getProfile(userAddress: Address): UserProfile? {
        return self.profiles[userAddress]
    }

    access(all) fun isMember(circleId: UInt64, userAddress: Address): Bool {
        if let members = self.memberships[circleId] {
            return members[userAddress] ?? false
        }
        return false
    }

    access(all) fun isFollowing(follower: Address, target: Address): Bool {
        if let follows = self.following[follower] {
            return follows[target] ?? false
        }
        return false
    }

    access(all) fun getCirclePosts(circleId: UInt64): [UInt64] {
        return self.circlePosts[circleId] ?? []
    }

    access(all) fun getUserPosts(userAddress: Address): [UInt64] {
        return self.userPosts[userAddress] ?? []
    }

    access(all) fun getPostMeta(postId: UInt64): PostMeta? {
        return self.postMeta[postId]
    }

    // ─── Init ─────────────────────────────────────────────────────
    init() {
        self.totalCircles = 0
        self.totalPosts = 0
        self.totalUsers = 0
        self.circles = {}
        self.memberships = {}
        self.following = {}
        self.profiles = {}
        self.postMeta = {}
        self.userPosts = {}
        self.circlePosts = {}
    }
}
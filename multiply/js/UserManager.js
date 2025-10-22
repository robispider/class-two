// js/UserManager.js

const USERS_KEY = 'mathGameUserProfiles';
const LAST_USER_KEY = 'mathGameLastActiveUser';

class UserManager {
    constructor() {
        this.users = []; // Will now be an array of objects: [{ name, avatar }, ...]
        this.currentUser = null; // Will now be a user object
        this.loadUsers();
    }

    loadUsers() {
        try {
            const savedUsers = localStorage.getItem(USERS_KEY);
            if (savedUsers) {
                this.users = JSON.parse(savedUsers);
            }
            const lastUserName = localStorage.getItem(LAST_USER_KEY);
            if (lastUserName) {
                // Find the full user object by name
                this.currentUser = this.users.find(u => u.name === lastUserName) || null;
            }
        } catch (error) {
            console.error('Failed to load user profiles.', error);
            this.users = [];
            this.currentUser = null;
        }
    }

    saveUsers() {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
            if (this.currentUser) {
                // Save only the name as the last active user identifier
                localStorage.setItem(LAST_USER_KEY, this.currentUser.name);
            } else {
                localStorage.removeItem(LAST_USER_KEY);
            }
        } catch (error) {
            console.error('Failed to save user profiles.', error);
        }
    }

    /**
     * Adds a new user with an avatar.
     * @param {string} name - The name of the new user.
     * @param {string} avatar - The filename of the chosen avatar.
     * @returns {boolean} - True if successful.
     */
    addUser(name, avatar) {
        if (name && avatar && !this.users.some(u => u.name === name)) {
            this.users.push({ name, avatar });
            this.saveUsers();
            return true;
        }
        return false;
    }
  /**
     * Finds a user by name and updates their avatar.
     * @param {string} userName - The name of the user to update.
     * @param {string} newAvatarFile - The filename of the new avatar.
     * @returns {boolean} - True if the update was successful.
     */
    updateUserAvatar(userName, newAvatarFile) {
        const user = this.users.find(u => u.name === userName);
        if (user && newAvatarFile) {
            user.avatar = newAvatarFile;
            this.saveUsers();
            return true;
        }
        return false;
    }
    
    /**
     * Sets the currently active user by their name.
     * @param {string} name - The name of the user to set as current.
     */
    setCurrentUser(name) {
        const user = this.users.find(u => u.name === name);
        if (user) {
            this.currentUser = user;
            this.saveUsers();
        }
    }

    /**
     * Clears the currently active user.
     */
    clearCurrentUser() {
        this.currentUser = null;
        this.saveUsers(); // This will remove the LAST_USER_KEY from localStorage
    }

    /**
     * @returns {object|null} The full object of the currently active user.
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * @returns {Array<object>} An array of all user profile objects.
     */
    getUserList() {
        return [...this.users];
    }
}

// Export a singleton instance
export const userManager = new UserManager();
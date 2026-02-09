import { UserPreferences } from '@anc/shared';
import { UserRepository } from '../repositories/userRepository';

export class PersonalizationService {
  constructor(private readonly userRepository = new UserRepository()) {}

  getPreferences(userId: string) {
    return this.userRepository.getPreferences(userId);
  }

  updatePreferences(payload: UserPreferences) {
    return this.userRepository.savePreferences(payload);
  }
}

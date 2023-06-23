import React from 'react';
import styles from '../../styles';
import {TouchableOpacity, View} from 'react-native';
import {Menu} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  menuVisible: boolean;
  closeMenu: () => void;
  openMenu: () => void;
  chooseImage: () => void;
}

const Header: React.FC<Props> = ({
  menuVisible,
  closeMenu,
  openMenu,
  chooseImage,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.menuContainer}>
        <Menu
          contentStyle={styles.menu}
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity
              onPress={menuVisible ? closeMenu : openMenu}
              style={styles.dropdownButton}>
              <Icon name={'dots-vertical'} size={30} color={'white'} />
            </TouchableOpacity>
          }>
          <Menu.Item
            onPress={() => chooseImage()}
            title="Change theme"
            titleStyle={{color: 'white'}}
            leadingIcon={() => (
              <Icon name={'palette'} size={25} color={'white'} />
            )}
            style={styles.menuItem}
          />
        </Menu>
      </View>
    </View>
  );
};

export default Header;
